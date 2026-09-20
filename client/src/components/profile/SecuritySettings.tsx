import React, { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button, useToast } from "../../ui";
import { API_BASE } from "../../lib/api";
import { motion } from "framer-motion";
import { ShieldCheck, MailCheck, MailWarning, KeyRound } from "lucide-react";

type Me = {
  email: string;
  email_verified_at?: string | null;
  totp_enabled?: boolean;
};

type ApiOptions = { method?: string; body?: unknown };

const api = async (path: string, opts: ApiOptions = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Request failed");
  return json;
};

const inputCls =
  "w-full bg-white/80 dark:bg-white/5 backdrop-blur-lg border outline-none border-gray-300/70 dark:border-white/10 rounded-2xl px-4 py-3 text-gray-800 dark:text-white placeholder-gray-500 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-200/50 transition-all duration-300";

export const SecuritySettings: React.FC = () => {
  const toast = useToast();
  const [me, setMe] = useState<Me | null>(null);
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const load = useCallback(async () => {
    try {
      setMe(await api("/auth/me"));
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (fn: () => Promise<void>, errorMsg: string) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : errorMsg);
    } finally {
      setBusy(false);
    }
  };

  const sendVerification = () =>
    run(async () => {
      await api("/auth/request-verification", { method: "POST" });
      toast.success("Verification email sent");
    }, "Failed to send email");

  const startMfaSetup = () =>
    run(async () => {
      const data = await api("/auth/mfa/setup");
      setSecret(data.secret);
      setQr(await QRCode.toDataURL(data.otpauth_url));
    }, "Failed to start setup");

  const confirmMfa = () =>
    run(async () => {
      const data = await api("/auth/mfa/verify", {
        method: "POST",
        body: { token: code.trim() },
      });
      setBackupCodes(Array.isArray(data.backupCodes) ? data.backupCodes : []);
      setSecret(null);
      setQr(null);
      setCode("");
      await load();
      toast.success("Two-factor authentication enabled");
    }, "Invalid code");

  const disableMfa = () =>
    run(async () => {
      await api("/auth/mfa/disable", {
        method: "POST",
        body: { token: code.trim() },
      });
      setCode("");
      setBackupCodes(null);
      await load();
      toast.success("Two-factor authentication disabled");
    }, "Invalid code");

  if (!me) return null;
  const verified = !!me.email_verified_at;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="dark:bg-gradient-to-br dark:bg-none bg-white/80 dark:bg-transparent dark:from-primary-light/10 dark:to-primary-dark/10 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/70 dark:border-white/15 shadow-2xl transition-all duration-500 space-y-8"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-400/15 flex items-center justify-center border border-cyan-200/50 dark:border-cyan-400/20">
          <ShieldCheck className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Security
          </h2>
          <p className="text-gray-600 dark:text-light/60 text-sm">
            Protect your account and verify your email
          </p>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          {verified ? (
            <MailCheck className="w-5 h-5 text-green-600 mt-0.5" />
          ) : (
            <MailWarning className="w-5 h-5 text-amber-500 mt-0.5" />
          )}
          <div>
            <p className="text-gray-800 dark:text-white font-medium">
              {verified ? "Email verified" : "Email not verified"}
            </p>
            <p className="text-gray-600 dark:text-light/60 text-sm">
              {me.email}
            </p>
          </div>
        </div>
        {!verified && (
          <Button type="button" onClick={sendVerification} disabled={busy}>
            Send verification email
          </Button>
        )}
      </div>

      <div className="border-t border-gray-200/70 dark:border-white/10 pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <KeyRound className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <p className="text-gray-800 dark:text-white font-medium">
            Two-factor authentication
          </p>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-light/70">
            {me.totp_enabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        {!me.totp_enabled && !secret && (
          <Button type="button" onClick={startMfaSetup} disabled={busy}>
            Enable 2FA
          </Button>
        )}

        {!me.totp_enabled && secret && (
          <div className="space-y-4 max-w-sm">
            <p className="text-gray-600 dark:text-light/60 text-sm">
              Scan this QR code with your authenticator app, then enter the
              6-digit code.
            </p>
            {qr && (
              <img
                src={qr}
                alt="MFA QR code"
                className="w-44 h-44 rounded-xl bg-white p-2"
              />
            )}
            <p className="text-xs text-gray-500 break-all">Secret: {secret}</p>
            <input
              className={inputCls}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
            />
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={confirmMfa}
                disabled={busy || !code.trim()}
              >
                Confirm
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setSecret(null);
                  setQr(null);
                  setCode("");
                }}
                disabled={busy}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {me.totp_enabled && (
          <div className="space-y-3 max-w-sm">
            <p className="text-gray-600 dark:text-light/60 text-sm">
              Enter a current code to disable two-factor authentication.
            </p>
            <input
              className={inputCls}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
            />
            <Button
              type="button"
              onClick={disableMfa}
              disabled={busy || !code.trim()}
            >
              Disable 2FA
            </Button>
          </div>
        )}

        {backupCodes && backupCodes.length > 0 && (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 border border-amber-200/70 dark:border-amber-400/30 p-4 space-y-2">
            <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">
              Save these backup codes now. They will not be shown again.
            </p>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm text-gray-800 dark:text-white">
              {backupCodes.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};