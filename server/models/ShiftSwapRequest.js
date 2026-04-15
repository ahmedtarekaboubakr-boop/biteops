import mongoose from 'mongoose';

const shiftSwapRequestSchema = new mongoose.Schema(
  {
    requester_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    target_staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    date: { type: String, required: true },
    shift: {
      type: String,
      required: true,
      enum: ['morning', 'middle', 'night'],
    },
    branch: { type: String, required: true },
    note: String,
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'approved', 'denied', 'cancelled'],
    },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewed_at: Date,
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

shiftSwapRequestSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.model('ShiftSwapRequest', shiftSwapRequestSchema);
