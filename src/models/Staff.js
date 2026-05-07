const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    staffId: { type: String, unique: true },
    position: {
      type: String,
      enum: ['nurse', 'receptionist', 'lab_technician', 'pharmacist', 'accountant', 'cleaner', 'security', 'other'],
      required: true,
    },
    shift: {
      type: String,
      enum: ['morning', 'afternoon', 'night', 'rotating'],
      required: true,
    },
    joiningDate: { type: Date, required: true },
    salary: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

staffSchema.pre('save', async function () {
  if (!this.staffId) {
    const count = await mongoose.model('Staff').countDocuments();
    this.staffId = `STF-${String(count + 1).padStart(5, '0')}`;
  }
});

module.exports = mongoose.model('Staff', staffSchema);
