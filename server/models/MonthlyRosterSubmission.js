import mongoose from 'mongoose';

const monthlyRosterSubmissionSchema = new mongoose.Schema({
  branch:       { type: String, required: true },
  year:         { type: Number, required: true },
  month:        { type: Number, required: true },
  manager_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:       { type: String, enum: ['submitted', 'edited'], default: 'submitted' },
  submitted_at: { type: Date, default: Date.now },
  last_edited_at: Date
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

monthlyRosterSubmissionSchema.index({ branch: 1, year: 1, month: 1 }, { unique: true });

monthlyRosterSubmissionSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.model('MonthlyRosterSubmission', monthlyRosterSubmissionSchema);
