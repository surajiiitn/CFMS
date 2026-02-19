import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: "" },
    branch: { type: String, default: "" },
    year: { type: Number, min: 1, max: 8, default: null },
    skills: { type: [String], default: [] },
    bio: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    roles: {
      type: [String],
      enum: ["poster", "freelancer"],
      default: ["poster", "freelancer"],
    },
    activeRole: {
      type: String,
      enum: ["poster", "freelancer"],
      default: "freelancer",
    },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

export const User = mongoose.model("User", userSchema);
