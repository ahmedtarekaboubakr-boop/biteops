import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  shift: {
    type: String,
    required: true,
    enum: ['morning', 'middle', 'night']
  },
  scheduled_start_time: String,
  scheduled_end_time: String,
  clock_in_time: Date,
  clock_out_time: Date,
  late_minutes: { type: Number, default: 0 },
  early_leave_minutes: { type: Number, default: 0 },
  overtime_minutes: { type: Number, default: 0 },
  status: {
    type: String,
    required: true,
    default: 'absent',
    enum: ['present', 'absent', 'late', 'half_day', 'on_leave']
  },
  branch: { type: String, required: true },
  notes: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

attendanceRecordSchema.index({ staff_id: 1, date: 1, shift: 1 }, { unique: true });

attendanceRecordSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('AttendanceRecord', attendanceRecordSchema);
