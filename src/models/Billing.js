const mongoose = require('mongoose');

const billingItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const billingSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    invoiceNo: { type: String, unique: true },
    items: [billingItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'refunded', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'insurance', 'online'],
    },
    paidAt: Date,
  },
  { timestamps: true }
);

billingSchema.pre('save', async function () {
  if (!this.invoiceNo) {
    const count = await mongoose.model('Billing').countDocuments();
    this.invoiceNo = `INV-${String(count + 1).padStart(6, '0')}`;
  }
});

module.exports = mongoose.model('Billing', billingSchema);
