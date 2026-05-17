import mongoose from 'mongoose';

const tutorialFolderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

tutorialFolderSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('TutorialFolder', tutorialFolderSchema);
