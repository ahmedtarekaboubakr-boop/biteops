import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  unit: { type: String, required: true },
  min_level: { type: Number, default: 10 },
  branch: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

inventoryItemSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('InventoryItem', inventoryItemSchema);
