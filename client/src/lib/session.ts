import axios, { type AxiosRequestConfig } from "axios";
import { API_BASE } from "./api";

let refreshPromise: Promise<boolean> | null = null;

export const refreshSession = (): Promise<boolean> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const AUTH_PATH = /\/auth\/(login|signup|refresh|logout|mfa\/login|verify-email|request-verification)/;

type RetryableConfig = AxiosRequestConfig & { _retried?: boolean };

export const setupAuthInterceptor = () => {
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error?.config as RetryableConfig | undefined;
      if (
        error?.response?.status === 401 &&
        config &&
        !config._retried &&
        !AUTH_PATH.test(config.url || "")
      ) {
        config._retried = true;
        const refreshed = await refreshSession();
        if (refreshed) {
          return axios(config);
        }
      }
      return Promise.reject(error);
    }
  );
};