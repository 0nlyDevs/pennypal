import { Button } from "../../ui";
import { API_BASE } from "../../lib/api";

type GoogleButtonProps = {
  label?: string;
  redirectUrl?: string; // defaults to /api/auth/google
  fullWidth?: boolean;
  className?: string;
};

export default function GoogleButton({
  label = "Continue with Google",
  redirectUrl,
  fullWidth = true,
  className,
}: GoogleButtonProps) {
  const targetUrl = redirectUrl || `${API_BASE}/auth/google`;
  const GoogleIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width={18} height={18}>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.44 31.91 29.065 35 24 35c-6.075 0-11-4.925-11-11s4.925-11 11-11c2.802 0 5.358 1.058 7.303 2.797l5.657-5.657C33.64 6.053 28.979 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c10.492 0 19-8.508 19-19 0-1.341-.138-2.651-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c2.802 0 5.358 1.058 7.303 2.797l5.657-5.657C33.64 6.053 28.979 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.005 0 9.621-1.917 13.127-5.043l-6.062-5.118C29.122 35.091 26.671 36 24 36c-5.041 0-9.36-3.078-10.926-7.387l-6.536 5.036C9.838 39.556 16.391 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.089 3.198-3.513 5.717-6.238 7.162l6.062 5.118C37.013 41.219 43 36 43 25c0-1.341-.138-2.651-.389-3.917z"/>
    </svg>
  );
  return (
    <Button
      type="button"
      startIcon={GoogleIcon}
      fullWidth={fullWidth}
      className={className}
      onClick={() => {
        window.location.href = targetUrl;
      }}
      classes={{label:"text-black"}}
    >
      {label}
    </Button>
  );
}

export const OrSeparation = () => {
  return (
    <div className="flex items-center gap-3 mt-2 mb-4">
      <div className="h-px flex-1 bg-gray-500" />
      <span className="text-xs text-gray-600">or</span>
      <div className="h-px flex-1 bg-gray-500" />
    </div>
  )
}
