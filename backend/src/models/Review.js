import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", maxlength: 1000 },
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

reviewSchema.index({ workspace: 1, fromUser: 1, toUser: 1 }, { unique: true });
reviewSchema.index({ toUser: 1, createdAt: -1 });

export const Review = mongoose.model("Review", reviewSchema);
