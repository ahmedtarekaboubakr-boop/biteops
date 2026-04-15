import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  request_type: {
    type: String,
    required: true,
    enum: ['leave', 'sick_leave', 'emergency_leave', 'quit']
  },
  start_date: { type: String, required: true },
  end_date: { type: String, required: true },
  number_of_days: { type: Number, required: true },
  reason: String,
  status: {
    type: String,
    required: true,
    default: 'pending',
    enum: ['pending', 'approved', 'denied']
  },
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  branch: { type: String, required: true },
  area_manager_status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'approved', 'denied']
  },
  area_manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  area_manager_updated_at: Date,
  operations_manager_status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'approved', 'denied']
  },
  operations_manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  operations_manager_updated_at: Date,
  hr_status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'approved', 'denied']
  },
  hr_manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hr_updated_at: Date,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

leaveRequestSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('LeaveRequest', leaveRequestSchema);
