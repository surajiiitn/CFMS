import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 150 },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 5000 },
    skills: { type: [String], default: [], index: true },
    budget: { type: Number, required: true, min: 100 },
    deadline: { type: Date, required: true },
    deliverables: { type: String, default: "" },
    referenceLinks: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["Open", "Assigned", "InProgress", "Submitted", "Completed"],
      default: "Open",
      index: true,
    },
    poster: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    selectedFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    assignedAt: { type: Date, default: null },
    inProgressAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
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

jobSchema.index({ title: "text" });
jobSchema.index({ createdAt: -1 });

export const Job = mongoose.model("Job", jobSchema);
