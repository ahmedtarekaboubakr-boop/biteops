import mongoose from 'mongoose';

const onboardingTaskSchema = new mongoose.Schema(
  {
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    done: { type: Boolean, default: false },
    due_date: String,
    sort_order: { type: Number, default: 0 },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    completed_at: Date,
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

onboardingTaskSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.model('OnboardingTask', onboardingTaskSchema);
