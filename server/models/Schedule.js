import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  shift: {
    type: String,
    required: true,
    enum: ['morning', 'middle', 'night']
  },
  branch: { type: String, required: true },
  station: String,
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

scheduleSchema.index({ staff_id: 1, date: 1, shift: 1 }, { unique: true });

scheduleSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('Schedule', scheduleSchema);
