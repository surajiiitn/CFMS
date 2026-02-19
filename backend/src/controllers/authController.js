import bcrypt from "bcrypt";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { User } from "../models/User.js";
import { generateOtp, sendOtpEmail } from "../utils/otp.js";
import { deleteOtpPayload, getOtpPayload, saveOtpPayload } from "../utils/otpStore.js";
import { env } from "../config/env.js";
import { isCollegeEmail } from "../utils/validation.js";
import { signToken } from "../utils/jwt.js";
import { serializeUser } from "../utils/serializer.js";

const buildAvatar = (seed) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

export const sendRegistrationOtp = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "name, email and password are required");
  }

  if (!isCollegeEmail(email)) {
    throw new ApiError(400, "Please use a valid college email address");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, "Account already exists. Please login.");
  }

  const existingPayload = await getOtpPayload(normalizedEmail);
  if (existingPayload?.lastSentAt) {
    const elapsed = Math.floor((Date.now() - existingPayload.lastSentAt) / 1000);
    if (elapsed < env.otpResendSeconds) {
      throw new ApiError(429, `Please wait ${env.otpResendSeconds - elapsed}s before requesting a new OTP`);
    }
  }

  const otp = generateOtp();
  const passwordHash = await bcrypt.hash(password, 10);

  const payload = {
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    otp,
    lastSentAt: Date.now(),
  };

  await saveOtpPayload(normalizedEmail, payload);
  try {
    await sendOtpEmail(normalizedEmail, otp);
  } catch (error) {
    try {
      await deleteOtpPayload(normalizedEmail);
    } catch {
      // No-op cleanup failure to preserve original email delivery error.
    }
    throw error;
  }

  return sendSuccess(res, 200, "OTP sent successfully", {
    email: normalizedEmail,
    expiresIn: env.otpTtlSeconds,
    resendAfter: env.otpResendSeconds,
  });
});

export const verifyRegistrationOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "email and otp are required");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const payload = await getOtpPayload(normalizedEmail);

  if (!payload) {
    throw new ApiError(400, "OTP expired or not found. Please request a new code.");
  }

  if (payload.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    await deleteOtpPayload(normalizedEmail);
    throw new ApiError(409, "Account already exists. Please login.");
  }

  const user = await User.create({
    name: payload.name,
    email: payload.email,
    passwordHash: payload.passwordHash,
    avatar: buildAvatar(payload.name),
  });

  await deleteOtpPayload(normalizedEmail);

  const token = signToken({ userId: user.id });

  return sendSuccess(res, 201, "Registration completed", {
    token,
    user: serializeUser(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !user.passwordHash || typeof user.passwordHash !== "string") {
    throw new ApiError(401, "Invalid credentials");
  }

  let passwordOk = false;
  try {
    passwordOk = await bcrypt.compare(password, user.passwordHash);
  } catch {
    passwordOk = false;
  }

  if (!passwordOk) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = signToken({ userId: user.id });

  return sendSuccess(res, 200, "Login successful", {
    token,
    user: serializeUser(user),
  });
});

export const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, "Profile fetched", {
    user: serializeUser(req.user),
  });
});

export const switchRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const validRoles = ["poster", "freelancer"];

  if (role && !validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  if (role) {
    req.user.activeRole = role;
  } else {
    req.user.activeRole = req.user.activeRole === "poster" ? "freelancer" : "poster";
  }

  await req.user.save();

  return sendSuccess(res, 200, "Role switched", {
    user: serializeUser(req.user),
  });
});
