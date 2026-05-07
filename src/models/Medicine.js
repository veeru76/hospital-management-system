const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true },
    category: {
      type: String,
      enum: [
        'antibiotic', 'analgesic', 'antiviral', 'antifungal',
        'antihypertensive', 'antidiabetic', 'vitamin', 'supplement', 'other',
      ],
      required: true,
    },
    manufacturer: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    expiryDate: { type: Date, required: true },
    requiresPrescription: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Medicine', medicineSchema);
