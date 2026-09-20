import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app.js";
import { resetDb } from "./helpers/db.js";
import { cookieHeader, parseCookies, signup } from "./helpers/auth.js";

beforeEach(async () => {
  await resetDb();
});

describe("signup and session cookies", () => {
  it("sets httpOnly token and refresh cookies, returns public user", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "session-user@example.com", password: "StrongPw1" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: "session-user@example.com" });
    expect(res.body.hashed_password).toBeUndefined();

    const setCookie = res.headers["set-cookie"] || [];
    const names = setCookie.map((c) => c.split("=")[0]);
    expect(names).toContain("token");
    expect(names).toContain("refresh");
    expect(setCookie.join(" ")).toMatch(/HttpOnly/i);
  });

  it("rejects /me without credentials", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the user from /me with a valid session cookie", async () => {
    const { email, cookies } = await signup();
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookieHeader({ token: cookies.token }));
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
  });

  it("logs out and revokes the refresh token", async () => {
    const { cookies } = await signup();
    const out = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookieHeader(cookies));
    expect(out.status).toBe(204);

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookieHeader({ refresh: cookies.refresh }));
    expect(res.status).toBe(401);
  });
});

describe("refresh token rotation and reuse detection", () => {
  it("rotates the refresh token and invalidates the previous one", async () => {
    const { cookies } = await signup();
    const oldRefresh = cookies.refresh;

    const r1 = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookieHeader({ refresh: oldRefresh }));
    expect(r1.status).toBe(200);
    const rotated = parseCookies(r1.headers["set-cookie"]);
    expect(rotated.refresh).toBeTruthy();
    expect(rotated.refresh).not.toBe(oldRefresh);

    const reuse = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookieHeader({ refresh: oldRefresh }));
    expect(reuse.status).toBe(401);
  });

  it("bans the token family and bumps token_version on reuse", async () => {
    const { cookies } = await signup();
    const oldRefresh = cookies.refresh;
    const oldAccess = cookies.token;

    await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookieHeader({ refresh: oldRefresh }));

    await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookieHeader({ refresh: oldRefresh }));

    const me = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookieHeader({ token: oldAccess }));
    expect(me.status).toBe(401);

    const reuseNew = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookieHeader(cookies));
    expect(reuseNew.status).toBe(401);
  });

  it("rejects missing or garbage refresh tokens", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
  });
});