import mongoose from 'mongoose';

const fingerprintLogSchema = new mongoose.Schema({
  staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scan_time: { type: Date, required: true },
  scan_type: {
    type: String,
    required: true,
    enum: ['clock_in', 'clock_out']
  },
  fingerprint_data: String,
  device_id: String,
  branch: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

fingerprintLogSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('FingerprintLog', fingerprintLogSchema);
