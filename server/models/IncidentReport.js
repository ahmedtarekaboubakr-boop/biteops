import mongoose from 'mongoose';

const incidentReportSchema = new mongoose.Schema(
  {
    branch: { type: String, required: true },
    reported_at: { type: Date, default: Date.now },
    type: {
      type: String,
      required: true,
      enum: ['customer_complaint', 'food_safety', 'injury', 'equipment', 'other'],
    },
    severity: { type: String, default: 'low' },
    description: { type: String, required: true },
    actions_taken: String,
    reported_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    photos: [String],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

incidentReportSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.model('IncidentReport', incidentReportSchema);
