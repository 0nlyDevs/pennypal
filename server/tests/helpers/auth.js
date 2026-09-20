import request from "supertest";
import app from "../../app.js";

export const PASSWORD = "StrongPw1";

export const parseCookies = (setCookie) => {
  const list = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const map = {};
  for (const c of list) {
    const [pair] = c.split(";");
    const idx = pair.indexOf("=");
    if (idx > 0) map[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  }
  return map;
};

export const cookieHeader = (cookies) =>
  Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");

export const emailAddress = (prefix = "user") =>
  `${prefix}${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}@example.com`;

export const signup = async (overrides = {}) => {
  const email = overrides.email || emailAddress();
  const password = overrides.password || PASSWORD;
  const res = await request(app)
    .post("/api/auth/signup")
    .send({
      email,
      password,
      firstname: overrides.firstname || "Test",
      lastname: overrides.lastname || "User",
    });
  if (res.status >= 400) {
    throw new Error(
      `signup failed: ${res.status} ${JSON.stringify(res.body || {})}`
    );
  }
  return {
    email,
    password,
    user: res.body,
    cookies: parseCookies(res.headers["set-cookie"]),
  };
};