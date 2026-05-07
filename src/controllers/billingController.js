const Billing = require('../models/Billing');
const Patient = require('../models/Patient');
const { success, error } = require('../utils/apiResponse');

const getBillings = async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId, paymentStatus } = req.query;
    const query = {};

    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient) return error(res, 'Patient profile not found', 404);
      query.patientId = patient._id;
    } else if (patientId) {
      query.patientId = patientId;
    }

    const billings = await Billing.find(query)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
      .populate('appointmentId', 'appointmentNo date')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Billing.countDocuments(query);
    return success(res, { billings, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    return error(res, err.message);
  }
};

const getBilling = async (req, res) => {
  try {
    const billing = await Billing.findById(req.params.id)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
      .populate('appointmentId', 'appointmentNo date');

    if (!billing) return error(res, 'Invoice not found', 404);

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient || billing.patientId._id.toString() !== patient._id.toString()) {
        return error(res, 'Access denied', 403);
      }
    }

    return success(res, billing);
  } catch (err) {
    return error(res, err.message);
  }
};

const createBilling = async (req, res) => {
  try {
    const { patientId, appointmentId, items, tax = 0, discount = 0, paymentMethod } = req.body;

    const subtotal = items.reduce((sum, item) => sum + item.amount * item.quantity, 0);
    const totalAmount = subtotal + tax - discount;

    const billing = await Billing.create({
      patientId,
      appointmentId,
      items,
      subtotal,
      tax,
      discount,
      totalAmount,
      paymentMethod,
    });

    await billing.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'name email' } },
      { path: 'appointmentId', select: 'appointmentNo date' },
    ]);

    return success(res, billing, 'Invoice created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentMethod } = req.body;

    const billing = await Billing.findById(req.params.id);
    if (!billing) return error(res, 'Invoice not found', 404);

    billing.paymentStatus = paymentStatus;
    if (paymentMethod) billing.paymentMethod = paymentMethod;
    if (paymentStatus === 'paid') billing.paidAt = new Date();

    await billing.save();
    return success(res, billing, 'Payment status updated');
  } catch (err) {
    return error(res, err.message);
  }
};

const getBillingSummary = async (req, res) => {
  try {
    const summary = await Billing.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' },
        },
      },
    ]);
    return success(res, summary);
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getBillings, getBilling, createBilling, updatePaymentStatus, getBillingSummary };
