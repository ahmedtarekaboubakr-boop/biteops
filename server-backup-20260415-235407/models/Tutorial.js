import mongoose from 'mongoose';

const tutorialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  filename: { type: String, required: true },
  file_path: { type: String, required: true },
  file_size: Number,
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

tutorialSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('Tutorial', tutorialSchema);
