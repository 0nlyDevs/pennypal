import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, TextField, useToast } from "../ui";
import { useAuth } from "../hooks/useAuth";
import { type LoginFormData } from "../types/Auth";
import LoginForm from "../components/auth/LoginForm";
import AuthLayout from "../components/auth/AuthLayout";
import { authLabelCls, authInputCls, submitCls } from "../components/auth/constants";

export default function LoginPage() {
  const { login, completeMfaLogin, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as ReturnType<typeof useLocation> & {
    state?: { from?: string } | null;
  };
  const toast = useToast();
  const [mfaRequired, setMfaRequired] = useState(false);
  const [code, setCode] = useState("");
  const from = (location.state && typeof location.state === 'object' && location.state?.from) || "/dashboard";

  async function onSubmit({ email, password }: LoginFormData) {
    try {
      const result = await login(email, password);
      if (result?.mfaRequired) {
        setMfaRequired(true);
        return;
      }
      toast.success("Signed in successfully");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    }
  }

  async function onSubmitMfa(e: React.FormEvent) {
    e.preventDefault();
    try {
      await completeMfaLogin(code.trim());
      toast.success("Signed in successfully");
      navigate(from, { replace: true });
    } catch {
      toast.error("Invalid verification code");
    }
  }

  if (mfaRequired) {
    return (
      <AuthLayout
        sideImageUrl="/auth-side.jpg"
        title="Two-factor authentication"
        subtitle={<span>Enter the code from your authenticator app.</span>}
      >
        <form onSubmit={onSubmitMfa} className="auth-form w-full max-w-sm space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <TextField
            label="Verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            variant="standard"
            required
            inputMode="text"
            autoComplete="one-time-code"
            classes={{ label: authLabelCls, input: authInputCls }}
          />
          <Button type="submit" disabled={loading} loading={loading} fullWidth className={submitCls}>
            Verify
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      sideImageUrl="/auth-side.jpg"
      title="Welcome back"
      subtitle={<span>Continue with Google or enter your details.</span>}
   >
      <LoginForm onSubmit={onSubmit} loading={loading} error={error} />
    </AuthLayout>
  );
}