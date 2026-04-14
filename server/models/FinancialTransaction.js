import mongoose from 'mongoose';

const financialTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['revenue_cash', 'revenue_card', 'petty_cash', 'fine', 'deposit', 'void', 'complimentary']
  },
  amount: { type: Number, required: true },
  reference: String,
  description: String,
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branch: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

financialTransactionSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('FinancialTransaction', financialTransactionSchema);
