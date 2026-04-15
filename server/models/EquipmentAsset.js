import mongoose from 'mongoose';

const equipmentAssetSchema = new mongoose.Schema(
  {
    branch: { type: String, required: true },
    name: { type: String, required: true },
    asset_tag: String,
    category: String,
    serial_number: String,
    status: { type: String, default: 'active' },
    purchase_date: String,
    last_service_at: Date,
    next_service_due: String,
    notes: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

equipmentAssetSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.model('EquipmentAsset', equipmentAssetSchema);
