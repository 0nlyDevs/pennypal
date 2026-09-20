import { useEffect, useState } from "react";
import { Button, TextField } from "../../ui";
import { Link, useNavigate } from "react-router-dom";
import { type SignupFormProps } from "../../types/Auth";
import { authLabelCls, authInputCls, authGoogleCls, submitCls } from "./constants";
import GoogleButton, { OrSeparation } from "./GoogleButton";
import ShowPasswordBtn from "./ShowPasswordBtn";
import PasswordStrength from "./PasswordStrength";
import { useToast } from "../../ui";
import UsernameModal from "./UsernameModal";
import CategoriesOnboardingModal from "./CategoriesOnboardingModal";
import { useProfile } from "../../hooks/useProfile";

export default function SignupForm({
  onSubmit,
  loading = false,
  error = null,
  submitLabel = "Sign up",
  showLoginLink = true,
}: SignupFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [postSignupOpen, setPostSignupOpen] = useState(false);
  const [postCategoriesOpen, setPostCategoriesOpen] = useState(false);
  const [usernameModal, setUsernameModal] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const toast = useToast()
  const { updateProfile } = useProfile();

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setEmailError("Please enter a valid email");
      return;
    }
    if (!password) return;
    if (confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }
    const payload = {
      email: trimmedEmail,
      password,
    };
    try {
      await onSubmit({ ...payload, confirmPassword });
      setUsernameModal("");
      setPostSignupOpen(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign up failed";
      toast.error(msg);
    }
  }

  useEffect(() => {
    if (error) toast.error(error);
  }, [error, toast]);

  return (
    <form onSubmit={handleSubmit} className="auth-form w-full max-w-sm space-y-4" autoComplete="off">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}
      <GoogleButton label="Continue with Google" className={authGoogleCls}/>
      <OrSeparation />
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => {
          const v = e.target.value;
          setEmail(v);
          if (!v) {
            setEmailError(null);
          } else if (!isValidEmail(v.trim())) {
            setEmailError("Invalid email format");
          } else {
            setEmailError(null);
          }
        }}
        variant="standard"
        required
        error={!!emailError}
        helperText={emailError || undefined}
        classes={{ label: authLabelCls, input: authInputCls, error: 'hidden' }}
        autoComplete="email"
        autoCorrect="off"
        autoCapitalize="none"
      />
      <TextField
        label="Password"
        type={showPassword ? "text" : "password"}
        placeholder="••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        variant="standard"
        required
        classes={{ label: authLabelCls, input: authInputCls }}
        autoComplete="new-password"
        endAdornment={
          <ShowPasswordBtn onClick={() => setShowPassword((p) => !p)} showPassword={showPassword}/>
        }
      />
      <TextField
        label="Confirm password"
        type={showConfirmPassword ? "text" : "password"}
        value={confirmPassword}
        onChange={(e) => {
          const v = e.target.value;
          setConfirmPassword(v);
          setConfirmPasswordError(v && v !== password ? "Passwords do not match" : null);
        }}
        variant="standard"
        required
        error={!!confirmPasswordError}
        helperText={confirmPasswordError || undefined}
        classes={{ label: authLabelCls, input: authInputCls, error: 'hidden' }}
        autoComplete="new-password"
        endAdornment={
          <ShowPasswordBtn onClick={() => setShowConfirmPassword((p) => !p)} showPassword={showConfirmPassword}/>
        }
      />
      <PasswordStrength password={password} />
      <Button
        type="submit"
        disabled={
          loading ||
          !email || !!emailError ||
          !password || !confirmPassword || !!confirmPasswordError ||
          confirmPassword !== password
        }
        loading={loading}
        loadingPosition="start"
        fullWidth
        className={submitCls}
      >
        {submitLabel}
      </Button>
      {showLoginLink && (
        <div className="text-sm text-black text-center mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-black font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      )}
      <UsernameModal
        open={postSignupOpen}
        email={email}
        username={usernameModal}
        onUsernameChange={setUsernameModal}
        saving={savingUsername}
        onClose={() => setPostSignupOpen(false)}
        onSkip={() => { setPostSignupOpen(false); setPostCategoriesOpen(true); }}
        onSave={async () => {
          setSavingUsername(true);
          try {
            const uname = usernameModal.trim();
            if (uname) {
              await updateProfile({ username: uname });
            }
            toast.success("Saved");
            setPostSignupOpen(false);
            setPostCategoriesOpen(true);
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to save username';
            toast.error(msg);
          } finally {
            setSavingUsername(false);
          }
        }}
      />
      <CategoriesOnboardingModal
        open={postCategoriesOpen}
        onClose={() => { setPostCategoriesOpen(false); setPostSignupOpen(true); }}
        onDone={() => { setPostCategoriesOpen(false); navigate('/dashboard', { replace: true }); }}
      />
    </form>
  );
}
