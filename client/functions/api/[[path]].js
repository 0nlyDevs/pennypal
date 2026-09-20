const DEFAULT_API_BASE = "https://pennypal-ya7b.onrender.com";

export const onRequest = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const base = (env.API_BASE || DEFAULT_API_BASE).replace(/\/+$/, "");
  const upstream = new URL(`${base}${url.pathname}${url.search}`);

  const headers = new Headers(request.headers);
  const hopByHop = [
    "host",
    "origin",
    "connection",
    "keep-alive",
    "upgrade",
    "te",
    "trailer",
    "transfer-encoding",
    "content-length",
    "proxy-authorization",
    "proxy-authenticate",
    "cf-connecting-ip",
    "cf-ray",
    "cf-visitor",
    "cf-ipcountry",
    "cf-request-id",
    "cf-worker",
  ];
  for (const name of hopByHop) {
    headers.delete(name);
  }

  const clientIp = request.headers.get("cf-connecting-ip");
  if (clientIp) {
    headers.set("x-forwarded-for", clientIp);
  }

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : request.body;

  const upstreamResponse = await fetch(upstream.toString(), {
    method: request.method,
    headers,
    body,
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  if (upstreamResponse.headers.getSetCookie) {
    for (const cookie of upstreamResponse.headers.getSetCookie()) {
      responseHeaders.append("set-cookie", cookie);
    }
  }
  upstreamResponse.headers.forEach((value, name) => {
    if (name.toLowerCase() !== "set-cookie") {
      responseHeaders.set(name, value);
    }
  });

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
};