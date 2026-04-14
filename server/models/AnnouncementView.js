import mongoose from 'mongoose';

const announcementViewSchema = new mongoose.Schema({
  announcement_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Announcement', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dismissed: { type: Number, default: 0 },
  viewed_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

announcementViewSchema.index({ announcement_id: 1, user_id: 1 }, { unique: true });

announcementViewSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('AnnouncementView', announcementViewSchema);
