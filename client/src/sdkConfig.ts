
import { OpenAPI } from './api';

// base URL: use env override or default to server dev URL
OpenAPI.BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080/api';

// Credentials: enable cookies for auth-backed endpoints
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = 'include';
