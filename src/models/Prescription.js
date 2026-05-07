const mongoose = require('mongoose');

const prescribedMedicineSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: String,
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    prescriptionNo: { type: String, unique: true },
    medicines: [prescribedMedicineSchema],
    diagnosis: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

prescriptionSchema.pre('save', async function () {
  if (!this.prescriptionNo) {
    const count = await mongoose.model('Prescription').countDocuments();
    this.prescriptionNo = `RX-${String(count + 1).padStart(6, '0')}`;
  }
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
