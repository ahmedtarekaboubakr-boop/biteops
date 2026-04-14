import mongoose from 'mongoose';

const checklistSchema = new mongoose.Schema({
  date: { type: String, required: true },
  shift: {
    type: String,
    required: true,
    enum: ['morning', 'night']
  },
  item_id: { type: String, required: true },
  completed: { type: Number, required: true, default: 0 },
  branch: { type: String, required: true },
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

checklistSchema.index({ date: 1, shift: 1, item_id: 1, branch: 1 }, { unique: true });

checklistSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('Checklist', checklistSchema);
