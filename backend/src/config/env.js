import dotenv from "dotenv";

dotenv.config();

const requiredVars = ["MONGODB_URI", "JWT_SECRET"];
const defaultDevOrigins = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const supportedEmailProviders = new Set(["resend"]);
const emailProvider = process.env.EMAIL_PROVIDER || "resend";

if (!supportedEmailProviders.has(emailProvider)) {
  throw new Error(
    `Unsupported EMAIL_PROVIDER "${emailProvider}". Supported providers: ${Array.from(
      supportedEmailProviders
    ).join(", ")}`
  );
}

const missing = requiredVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

const providerRequiredVars = {
  resend: ["RESEND_API_KEY", "EMAIL_FROM"],
};
const providerMissing = providerRequiredVars[emailProvider].filter((key) => !process.env[key]);

if (providerMissing.length > 0) {
  console.warn(
    `[Email] Missing ${providerMissing.join(
      ", "
    )}. OTP email sending is disabled until provider credentials are configured.`
  );
}

const configuredOrigins = (process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins =
  configuredOrigins.length > 0 ? configuredOrigins : defaultDevOrigins;

const isLoopbackHost = (hostname) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

const isPrivateIPv4Host = (hostname) => {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  const [first, second] = parts;
  if (first === 10) return true;
  if (first === 192 && second === 168) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  if (first === 169 && second === 254) return true;
  return false;
};

const isPrivateIPv6Host = (hostname) => {
  const value = hostname.toLowerCase();
  if (value === "::1") return true;
  // Link-local fe80::/10 and unique-local fc00::/7
  return (
    value.startsWith("fe8") ||
    value.startsWith("fe9") ||
    value.startsWith("fea") ||
    value.startsWith("feb") ||
    value.startsWith("fc") ||
    value.startsWith("fd")
  );
};

const isDevNetworkOrigin = (origin) => {
  if (typeof origin !== "string") return false;
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return (
      isLoopbackHost(url.hostname) ||
      isPrivateIPv4Host(url.hostname) ||
      isPrivateIPv6Host(url.hostname) ||
      url.hostname.endsWith(".local")
    );
  } catch {
    return false;
  }
};

export const isAllowedOrigin = (origin) => {
  // Requests from curl/mobile apps may have no origin header.
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if ((process.env.NODE_ENV || "development") !== "production" && isDevNetworkOrigin(origin)) {
    return true;
  }
  return false;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  host: process.env.HOST || "0.0.0.0",
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  allowedOrigin: allowedOrigins,
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  otpTtlSeconds: Number(process.env.OTP_TTL_SECONDS || 300),
  otpResendSeconds: Number(process.env.OTP_RESEND_SECONDS || 30),
  emailProvider,
  emailFrom: process.env.EMAIL_FROM || "",
  resendApiKey: process.env.RESEND_API_KEY || "",
  appName: process.env.APP_NAME || "CFMS",
};
