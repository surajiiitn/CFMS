import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    type: {
      type: String,
      enum: ["proposal", "accepted", "message", "submitted", "completed", "rejected"],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 250 },
    read: { type: Boolean, default: false, index: true },
    metadata: {
      job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
      workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", default: null },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
