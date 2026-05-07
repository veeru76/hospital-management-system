const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    startTime: String,
    endTime: String,
    maxAppointments: { type: Number, default: 20 },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    doctorId: { type: String, unique: true },
    specialization: { type: String, required: true, trim: true },
    qualification: [String],
    experience: { type: Number, default: 0 },
    consultationFee: { type: Number, required: true },
    availability: [availabilitySchema],
    status: {
      type: String,
      enum: ['active', 'on_leave', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

doctorSchema.pre('save', async function () {
  if (!this.doctorId) {
    const count = await mongoose.model('Doctor').countDocuments();
    this.doctorId = `DOC-${String(count + 1).padStart(5, '0')}`;
  }
});

module.exports = mongoose.model('Doctor', doctorSchema);
