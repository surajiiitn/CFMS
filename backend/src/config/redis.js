import { createClient } from "redis";
import { env } from "./env.js";

let redisClient = null;
let redisReady = false;

export const connectRedis = async () => {
  const client = createClient({
    url: env.redisUrl,
    socket: {
      connectTimeout: 2000,
      reconnectStrategy: () => false,
    },
  });

  client.on("error", (err) => {
    redisReady = false;
    const message = err?.message || "Unknown Redis connection error";
    console.warn("Redis error:", message);
  });

  client.on("ready", () => {
    redisReady = true;
    console.log("Redis connected");
  });

  try {
    await client.connect();
    redisClient = client;
  } catch (error) {
    redisClient = null;
    redisReady = false;
    console.warn("Redis unavailable. Falling back to in-memory OTP store.");
  }

  return redisClient;
};

export const getRedisClient = () => redisClient;

export const isRedisReady = () => redisReady && redisClient?.isOpen;
