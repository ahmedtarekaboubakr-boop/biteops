import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema({
  item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  type: {
    type: String,
    required: true,
    enum: ['receive', 'transfer', 'waste', 'dispose', 'adjustment']
  },
  quantity: { type: Number, required: true },
  to_branch: String,
  reason: String,
  notes: String,
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branch: { type: String, required: true },
  status: { type: String, default: 'completed' },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

inventoryTransactionSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('InventoryTransaction', inventoryTransactionSchema);
