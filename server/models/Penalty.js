import mongoose from 'mongoose';

const penaltySchema = new mongoose.Schema({
  staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  penalty_type: { type: String, required: true },
  misconduct_description: { type: String, required: true },
  penalty_amount: { type: Number, default: 0 },
  penalty_details: String,
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branch: { type: String, required: true },
  status: {
    type: String,
    required: true,
    default: 'active',
    enum: ['active', 'resolved', 'cancelled']
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

penaltySchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('Penalty', penaltySchema);
