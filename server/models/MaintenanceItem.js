import mongoose from 'mongoose';

const maintenanceItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['machinery', 'cleaning_supplies', 'electronics', 'supplies', 'furniture']
  },
  description: String,
  quantity: { type: Number, default: 1 },
  branch: { type: String, required: true },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'needs_repair', 'out_of_order', 'disposed']
  },
  notes: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

maintenanceItemSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('MaintenanceItem', maintenanceItemSchema);
