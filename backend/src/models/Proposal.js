import mongoose from "mongoose";

const proposalSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    poster: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    approach: { type: String, required: true, trim: true, minlength: 20, maxlength: 500 },
    timeline: { type: String, required: true, trim: true, maxlength: 100 },
    quote: { type: Number, required: true, min: 100 },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
      index: true,
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

proposalSchema.index({ job: 1, freelancer: 1 }, { unique: true });
proposalSchema.index({ job: 1, createdAt: -1 });

export const Proposal = mongoose.model("Proposal", proposalSchema);
