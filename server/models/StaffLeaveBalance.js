import mongoose from 'mongoose';

const staffLeaveBalanceSchema = new mongoose.Schema({
  staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  total_leave_days: { type: Number, required: true, default: 0 },
  used_leave_days: { type: Number, required: true, default: 0 },
  remaining_leave_days: { type: Number, required: true, default: 0 },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

staffLeaveBalanceSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('StaffLeaveBalance', staffLeaveBalanceSchema);
