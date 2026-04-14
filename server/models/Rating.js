import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nails_cut: { type: Number, required: true, default: 0, enum: [0, 1] },
  beard_shaved: { type: Number, required: true, default: 0, enum: [0, 1] },
  clean_tshirt: { type: Number, required: true, default: 0, enum: [0, 1] },
  black_pants: { type: Number, required: true, default: 0, enum: [0, 1] },
  correct_footwear: { type: Number, required: true, default: 0, enum: [0, 1] },
  performance: { type: Number, required: true, min: 0, max: 5 },
  total_score: { type: Number, required: true, min: 0, max: 10 },
  notes: String,
  branch: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ratingSchema.index({ staff_id: 1, date: 1, manager_id: 1 }, { unique: true });

ratingSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('Rating', ratingSchema);
