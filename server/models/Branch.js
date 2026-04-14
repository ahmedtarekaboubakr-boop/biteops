import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  address: String,
  phone: String,
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  area: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

branchSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('Branch', branchSchema);
