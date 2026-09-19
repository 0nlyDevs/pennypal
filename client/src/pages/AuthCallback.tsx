import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation() as ReturnType<typeof useLocation> & {
    state?: { from?: string } | null;
  };
  const { refresh } = useAuth();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");
    const from = (location.state && typeof location.state === 'object' && location.state?.from) || "/dashboard";

    (async () => {
      try {
        if (code) {
          const apiBase = (import.meta.env.VITE_API_BASE || "http://localhost:8080/api").replace(/\/$/, "");
          await fetch(`${apiBase}/auth/otc`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
            credentials: "include",
          });
        }
        await refresh();
      } finally {
        navigate(from, { replace: true });
      }
    })();
  }, [navigate, refresh, location.state]);

  return (
    <div className="min-h-screen flex items-center justify-center p-24">
      <div className="text-gray-700">Finishing sign-in…</div>
    </div>
  );
}
