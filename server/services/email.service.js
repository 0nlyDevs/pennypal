import { Resend } from "resend";

let resend = null;

const getResend = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

export const sendVerificationEmail = async ({ to, verificationUrl }) => {
  const client = getResend();
  if (!client) return false;
  const { error } = await client.emails.send({
    from: process.env.EMAIL_FROM || "PennyPal <onboarding@resend.dev>",
    to,
    subject: "Verify your email address",
    html: `<p>Please confirm your email address to secure your PennyPal account.</p><p><a href="${verificationUrl}">Verify email</a></p>`,
  });
  return !error;
};