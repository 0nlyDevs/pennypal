export const getFrontendBase = () =>
  process.env.FRONTEND_URL ||
  process.env.CORS_ORIGIN ||
  "http://localhost:5173";

export const getApiBase = () =>
  (process.env.API_PUBLIC_URL || `${getFrontendBase()}/api`).replace(/\/$/, "");