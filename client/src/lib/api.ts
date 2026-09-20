const rawBase = import.meta.env.VITE_API_BASE || "/api";

export const API_BASE = rawBase.replace(/\/+$/, "") || "/api";