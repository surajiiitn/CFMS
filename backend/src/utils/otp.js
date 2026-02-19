import crypto from "crypto";
import { env } from "../config/env.js";
import { ApiError } from "./apiError.js";

const RESEND_API_URL = "https://api.resend.com/emails";

const escapeHtml = (input) =>
  input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const buildOtpEmailTemplate = (otp) => {
  const safeOtp = escapeHtml(otp);
  const safeAppName = escapeHtml(env.appName);
  const ttlMinutes = Math.max(1, Math.ceil(env.otpTtlSeconds / 60));

  return {
    subject: `${safeAppName} verification code`,
    text: `Your ${safeAppName} verification code is ${safeOtp}. It expires in ${ttlMinutes} minute(s). If you did not request this, ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
        <h2 style="margin: 0 0 12px;">${safeAppName} Email Verification</h2>
        <p style="margin: 0 0 12px;">Use this one-time code to complete your registration:</p>
        <div style="display: inline-block; font-size: 32px; letter-spacing: 6px; font-weight: 700; padding: 10px 14px; background: #f3f4f6; border-radius: 8px;">
          ${safeOtp}
        </div>
        <p style="margin: 16px 0 0;">Code expires in ${ttlMinutes} minute(s).</p>
        <p style="margin: 8px 0 0; color: #6b7280;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  };
};

const sendWithResend = async (email, otp) => {
  if (!env.resendApiKey || !env.emailFrom) {
    throw new ApiError(500, "Email provider is not configured. Set RESEND_API_KEY and EMAIL_FROM.");
  }

  const { subject, text, html } = buildOtpEmailTemplate(otp);

  let response;
  try {
    response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.emailFrom,
        to: [email],
        subject,
        text,
        html,
      }),
    });
  } catch (error) {
    throw new ApiError(502, "Failed to reach email provider.", {
      provider: env.emailProvider,
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }

  if (!response.ok) {
    let details = null;
    try {
      details = await response.json();
    } catch {
      details = null;
    }

    throw new ApiError(502, "Failed to send OTP email.", details);
  }
};

export const sendOtpEmail = async (email, otp) => {
  if (env.emailProvider === "resend") {
    await sendWithResend(email, otp);
    return;
  }

  throw new ApiError(500, `Unsupported email provider: ${env.emailProvider}`);
};
