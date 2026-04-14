import mongoose from 'mongoose';

const hrNotificationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  message: { type: String, required: true },
  branch: String,
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  is_read: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

hrNotificationSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('HrNotification', hrNotificationSchema);
