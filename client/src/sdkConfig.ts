import { OpenAPI } from './api';
import { API_BASE } from './lib/api';

// base URL: relative /api in production (cloudflare pages function), env override for local dev
OpenAPI.BASE = API_BASE;

// Credentials: enable cookies for auth-backed endpoints
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = 'include';