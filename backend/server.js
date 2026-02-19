import http from "http";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { connectRedis } from "./src/config/redis.js";
import { env } from "./src/config/env.js";
import { initSocket } from "./src/sockets/index.js";

const startServer = async () => {
  await connectDB();
  await connectRedis();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, env.host, () => {
    console.log(`CFMS backend listening on http://${env.host}:${env.port}`);
  });

  const shutdown = async () => {
    console.log("Shutting down server...");
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
