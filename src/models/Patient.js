const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema(
  {
    condition: String,
    diagnosedDate: Date,
    treatment: String,
    notes: String,
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  { _id: false }
);

const emergencyContactSchema = new mongoose.Schema(
  {
    name: String,
    relationship: String,
    phone: String,
  },
  { _id: false }
);

const insuranceInfoSchema = new mongoose.Schema(
  {
    provider: String,
    policyNumber: String,
    expiryDate: Date,
  },
  { _id: false }
);

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientId: { type: String, unique: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    address: addressSchema,
    emergencyContact: emergencyContactSchema,
    medicalHistory: [medicalHistorySchema],
    allergies: [String],
    insuranceInfo: insuranceInfoSchema,
  },
  { timestamps: true }
);

patientSchema.pre('save', async function () {
  if (!this.patientId) {
    const count = await mongoose.model('Patient').countDocuments();
    this.patientId = `PAT-${String(count + 1).padStart(5, '0')}`;
  }
});

module.exports = mongoose.model('Patient', patientSchema);
