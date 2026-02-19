import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/User.js";
import { Workspace } from "../models/Workspace.js";
import { Message } from "../models/Message.js";
import { createNotification } from "../utils/notifications.js";
import { ensureParticipant, getCounterpartyId, setJobStatus } from "../utils/workflow.js";
import { serializeMessage } from "../utils/serializer.js";
import { setSocketServer } from "../config/socket.js";
import { isAllowedOrigin } from "../config/env.js";

const getTokenFromHandshake = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  const header = socket.handshake.headers?.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme === "Bearer") return token;

  return null;
};

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Socket CORS blocked for origin: ${origin}`), false);
      },
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = getTokenFromHandshake(socket);
      if (!token) return next(new Error("Unauthorized"));

      const payload = verifyToken(token);
      const user = await User.findById(payload.userId);
      if (!user) return next(new Error("Unauthorized"));

      socket.user = user;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    socket.join(`user:${userId}`);

    socket.on("workspace:join", async (payload = {}, callback) => {
      try {
        const workspace = await Workspace.findById(payload.workspaceId).populate("job");
        if (!workspace) throw new Error("Workspace not found");

        ensureParticipant(workspace, socket.user._id);
        socket.join(`workspace:${workspace._id.toString()}`);

        callback?.({ success: true });
      } catch (error) {
        callback?.({ success: false, message: error.message || "Unable to join workspace" });
      }
    });

    socket.on("workspace:leave", (payload = {}, callback) => {
      if (payload.workspaceId) {
        socket.leave(`workspace:${payload.workspaceId}`);
      }
      callback?.({ success: true });
    });

    socket.on("workspace:message", async (payload = {}, callback) => {
      try {
        const { workspaceId, text } = payload;
        if (!workspaceId || !text || !String(text).trim()) {
          throw new Error("workspaceId and text are required");
        }

        const workspace = await Workspace.findById(workspaceId).populate("job");
        if (!workspace) throw new Error("Workspace not found");

        ensureParticipant(workspace, socket.user._id);

        if (workspace.job.status === "Assigned") {
          await setJobStatus(workspace.job, "InProgress");
        }

        const message = await Message.create({
          workspace: workspace._id,
          sender: socket.user._id,
          text: String(text).trim(),
        });

        const serialized = serializeMessage(message);

        io.to(`workspace:${workspace._id.toString()}`).emit("workspace:message:new", serialized);

        const recipient = getCounterpartyId(workspace, socket.user._id);
        await createNotification({
          recipient,
          actor: socket.user._id,
          type: "message",
          title: "New Message",
          description: `${socket.user.name} sent you a message`,
          metadata: { workspace: workspace._id, job: workspace.job._id },
        });

        callback?.({ success: true, data: serialized });
      } catch (error) {
        callback?.({ success: false, message: error.message || "Unable to send message" });
      }
    });
  });

  setSocketServer(io);
  return io;
};
