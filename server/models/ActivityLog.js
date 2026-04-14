import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user_name: { type: String, required: true },
    user_role: { type: String, required: true },
    action_type: { type: String, required: true },
    action_description: { type: String, required: true },
    branch: String,
    details: String,
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

activityLogSchema.virtual("id").get(function () {
  return this._id.toString();
});

export default mongoose.model("ActivityLog", activityLogSchema);
