import mongoose from 'mongoose';

const monthlyRosterEntrySchema = new mongoose.Schema({
  branch:   { type: String, required: true },
  year:     { type: Number, required: true },
  month:    { type: Number, required: true }, // 1-12
  staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day:      { type: Number, required: true }, // 1-31
  status:   { type: String, enum: ['P', 'O', 'A', 'X', 'C', 'H', 'V', 'SL'], required: true }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

monthlyRosterEntrySchema.index({ branch: 1, year: 1, month: 1, staff_id: 1, day: 1 }, { unique: true });

monthlyRosterEntrySchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.model('MonthlyRosterEntry', monthlyRosterEntrySchema);
