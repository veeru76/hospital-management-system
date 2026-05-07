const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema(
  {
    bedNo: { type: String, required: true },
    isOccupied: { type: Boolean, default: false },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, trim: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    type: {
      type: String,
      enum: ['general', 'private', 'icu', 'emergency', 'operation_theatre', 'laboratory'],
      required: true,
    },
    floor: { type: Number, required: true },
    beds: [bedSchema],
    ratePerDay: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'reserved'],
      default: 'available',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
