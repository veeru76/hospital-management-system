const mongoose = require('mongoose');

const resultParamSchema = new mongoose.Schema(
  {
    parameter: { type: String, required: true },
    value: { type: String, required: true },
    unit: String,
    normalRange: String,
    isAbnormal: { type: Boolean, default: false },
  },
  { _id: false }
);

const labReportSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    reportNo: { type: String, unique: true },
    testName: { type: String, required: true, trim: true },
    testCategory: {
      type: String,
      enum: ['blood', 'urine', 'imaging', 'pathology', 'microbiology', 'other'],
      required: true,
    },
    results: [resultParamSchema],
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending',
    },
    remarks: { type: String, trim: true },
    conductedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

labReportSchema.pre('save', async function () {
  if (!this.reportNo) {
    const count = await mongoose.model('LabReport').countDocuments();
    this.reportNo = `LAB-${String(count + 1).padStart(6, '0')}`;
  }
});

module.exports = mongoose.model('LabReport', labReportSchema);
