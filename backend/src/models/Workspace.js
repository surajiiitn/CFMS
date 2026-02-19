import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    link: { type: String, default: "" },
    notes: { type: String, default: "" },
    submittedAt: { type: Date, default: null },
  },
  { _id: false }
);

const workspaceSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, unique: true, index: true },
    poster: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["Active", "Completed"], default: "Active" },
    resources: { type: [resourceSchema], default: [] },
    submission: { type: submissionSchema, default: () => ({}) },
    approvedAt: { type: Date, default: null },
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

workspaceSchema.index({ poster: 1, updatedAt: -1 });
workspaceSchema.index({ freelancer: 1, updatedAt: -1 });

export const Workspace = mongoose.model("Workspace", workspaceSchema);
