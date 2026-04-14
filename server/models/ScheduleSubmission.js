import mongoose from 'mongoose';

const scheduleSubmissionSchema = new mongoose.Schema({
  branch: { type: String, required: true },
  week_start: { type: String, required: true },
  week_end: { type: String, required: true },
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    required: true,
    default: 'submitted',
    enum: ['submitted', 'edited']
  },
  submitted_at: { type: Date, default: Date.now },
  last_edited_at: Date
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

scheduleSubmissionSchema.index({ branch: 1, week_start: 1 }, { unique: true });

scheduleSubmissionSchema.virtual('id').get(function() {
  return this._id.toString();
});

export default mongoose.model('ScheduleSubmission', scheduleSubmissionSchema);
