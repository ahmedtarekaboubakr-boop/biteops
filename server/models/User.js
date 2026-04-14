import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password: String,
  role: {
    type: String,
    required: true,
    enum: ['owner', 'manager', 'hr_manager', 'operations_manager', 'area_manager', 'staff']
  },
  employee_code: { type: String, unique: true, sparse: true },
  date_of_birth: String,
  start_date: String,
  payroll_info: String,
  main_focus_area: String,
  shift: {
    type: String,
    enum: ['morning', 'middle', 'night']
  },
  branch: String,
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive']
  },
  photo: String,
  salary: Number,
  health_certificate: String,
  area: String,
  title: String,
  phone_number: String,
  id_number: String,
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('User', userSchema);
