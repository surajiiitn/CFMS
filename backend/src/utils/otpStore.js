import { env } from "../config/env.js";
import { getRedisClient, isRedisReady } from "../config/redis.js";

const memoryStore = new Map();

const buildKey = (email) => `otp:${email.toLowerCase()}`;

export const saveOtpPayload = async (email, payload) => {
  const key = buildKey(email);
  const value = JSON.stringify(payload);

  if (isRedisReady()) {
    const redis = getRedisClient();
    await redis.set(key, value, { EX: env.otpTtlSeconds });
    return;
  }

  const expiresAt = Date.now() + env.otpTtlSeconds * 1000;
  memoryStore.set(key, { value, expiresAt });
};

export const getOtpPayload = async (email) => {
  const key = buildKey(email);

  if (isRedisReady()) {
    const redis = getRedisClient();
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return JSON.parse(entry.value);
};

export const deleteOtpPayload = async (email) => {
  const key = buildKey(email);

  if (isRedisReady()) {
    const redis = getRedisClient();
    await redis.del(key);
    return;
  }

  memoryStore.delete(key);
};
