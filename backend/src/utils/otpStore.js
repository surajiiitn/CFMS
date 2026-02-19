import { env } from "../config/env.js";
import { getRedisClient, isRedisReady } from "../config/redis.js";

const memoryStore = new Map();

const buildKey = (email) => `otp:${email.toLowerCase()}`;

export const saveOtpPayload = async (email, payload) => {
  const key = buildKey(email);
  const value = JSON.stringify(payload);

  if (isRedisReady()) {
    try {
      const redis = getRedisClient();
      await redis.set(key, value, { EX: env.otpTtlSeconds });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Redis write error";
      console.warn(`Redis SET failed for OTP store. Falling back to memory: ${message}`);
    }
  }

  const expiresAt = Date.now() + env.otpTtlSeconds * 1000;
  memoryStore.set(key, { value, expiresAt });
};

export const getOtpPayload = async (email) => {
  const key = buildKey(email);

  if (isRedisReady()) {
    try {
      const redis = getRedisClient();
      const value = await redis.get(key);
      if (value) {
        return JSON.parse(value);
      }
      // If Redis has no value (e.g., write failed and we used memory fallback),
      // continue and check memory store before declaring "not found".
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Redis read error";
      console.warn(`Redis GET failed for OTP store. Falling back to memory: ${message}`);
    }
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
    try {
      const redis = getRedisClient();
      await redis.del(key);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Redis delete error";
      console.warn(`Redis DEL failed for OTP store. Falling back to memory: ${message}`);
    }
  }

  memoryStore.delete(key);
};
