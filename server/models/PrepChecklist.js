import mongoose from 'mongoose';

const prepChecklistSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    shift: {
      type: String,
      required: true,
      enum: ['morning', 'night'],
    },
    item_id: { type: String, required: true },
    completed: { type: Number, required: true, default: 0 },
    branch: { type: String, required: true },
    manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

prepChecklistSchema.index({ date: 1, shift: 1, item_id: 1, branch: 1 }, { unique: true });

prepChecklistSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.model('PrepChecklist', prepChecklistSchema);
