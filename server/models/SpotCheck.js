import mongoose from 'mongoose';

const spotCheckSchema = new mongoose.Schema({
  date: { type: String, required: true },
  branch: { type: String, required: true },
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  check_type: {
    type: String,
    required: true,
    enum: ['start_of_day', 'end_of_day']
  },
  category: {
    type: String,
    required: true,
    enum: ['proteins', 'beverages']
  },
  item_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  notes: String,
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

spotCheckSchema.index({ date: 1, branch: 1, check_type: 1, category: 1, item_name: 1 }, { unique: true });

spotCheckSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('SpotCheck', spotCheckSchema);
