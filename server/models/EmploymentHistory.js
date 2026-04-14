import mongoose from 'mongoose';

const employmentHistorySchema = new mongoose.Schema({
  staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  previous_title: String,
  new_title: { type: String, required: true },
  change_date: { type: String, required: true },
  change_type: {
    type: String,
    required: true,
    default: 'promotion',
    enum: ['promotion', 'demotion', 'transfer', 'title_change', 'deactivation']
  },
  notes: String,
  changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

employmentHistorySchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('EmploymentHistory', employmentHistorySchema);
