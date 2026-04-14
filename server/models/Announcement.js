import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  target_roles: { type: String, required: true },
  target_branches: String,
  target_staff_ids: String,
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

announcementSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('Announcement', announcementSchema);
