import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, DefaultService, type PublicUser } from '../api';
import { API_BASE } from '../lib/api';
import { extractErrorMessage, toFriendlyAuthMessage } from '../lib/authErrors';

export const useAuth = () => {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const me = useCallback(async () => {
    setError(null);
    try {
      const u = await DefaultService.getAuthMe();
      setUser(u);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        return;
      }
      setUser(null);
      setError(extractErrorMessage(err, 'Failed to fetch session'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    me();
  }, [me]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await DefaultService.postAuthLogin({ email, password });
      if ((result as { mfaRequired?: boolean })?.mfaRequired) {
        return { mfaRequired: true as const };
      }
      const u = await DefaultService.getAuthMe();
      setUser(u);
      return { mfaRequired: false as const, user: u };
    } catch (err) {
      const msg = toFriendlyAuthMessage(err, 'login');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeMfaLogin = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/mfa/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code }),
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Invalid verification code');
      }
      const u = await DefaultService.getAuthMe();
      setUser(u);
      return u;
    } catch (err) {
      setError(extractErrorMessage(err, 'Invalid verification code'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(
    async (params: { email: string; password: string; username?: string; firstname?: string; lastname?: string }) => {
      setLoading(true);
      setError(null);
      try {
        await DefaultService.postAuthSignup({ email: params.email, password: params.password });
        const u = await DefaultService.getAuthMe();
        setUser(u);
        return u;
      } catch (err) {
        const msg = toFriendlyAuthMessage(err, 'signup');
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await DefaultService.postAuthLogout();
      setUser(null);
    } catch (err) {
      const msg = toFriendlyAuthMessage(err, 'logout');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, login, completeMfaLogin, signup, logout, refresh: me }),
    [user, loading, error, login, completeMfaLogin, signup, logout, me]
  );

  return value;
}
