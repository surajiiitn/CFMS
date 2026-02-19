import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async () => {
  await mongoose.connect(env.mongoUri, {
    autoIndex: true,
  });
  console.log("MongoDB connected");
};
