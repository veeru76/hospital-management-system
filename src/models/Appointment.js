const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    appointmentNo: { type: String, unique: true },
    date: { type: Date, required: true },
    timeSlot: { type: timeSlotSchema, required: true },
    type: {
      type: String,
      enum: ['in_person', 'teleconsultation', 'follow_up', 'emergency'],
      default: 'in_person',
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled',
    },
    reason: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

appointmentSchema.pre('save', async function () {
  if (!this.appointmentNo) {
    const count = await mongoose.model('Appointment').countDocuments();
    this.appointmentNo = `APT-${String(count + 1).padStart(6, '0')}`;
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
