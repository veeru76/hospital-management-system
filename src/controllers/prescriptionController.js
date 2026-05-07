const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { success, error } = require('../utils/apiResponse');

const getPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId } = req.query;
    const query = {};

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient) return error(res, 'Patient profile not found', 404);
      query.patientId = patient._id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (!doctor) return error(res, 'Doctor profile not found', 404);
      query.doctorId = doctor._id;
    } else if (patientId) {
      query.patientId = patientId;
    }

    const prescriptions = await Prescription.find(query)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .populate('appointmentId', 'appointmentNo date')
      .populate('medicines.medicineId', 'name genericName')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Prescription.countDocuments(query);
    return success(res, { prescriptions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    return error(res, err.message);
  }
};

const getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .populate('appointmentId', 'appointmentNo date')
      .populate('medicines.medicineId', 'name genericName price');

    if (!prescription) return error(res, 'Prescription not found', 404);

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient || prescription.patientId._id.toString() !== patient._id.toString()) {
        return error(res, 'Access denied', 403);
      }
    }

    return success(res, prescription);
  } catch (err) {
    return error(res, err.message);
  }
};

const createPrescription = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentId, medicines, diagnosis, notes } = req.body;

    const prescription = await Prescription.create({
      patientId,
      doctorId,
      appointmentId,
      medicines,
      diagnosis,
      notes,
    });

    await prescription.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'name' } },
      { path: 'doctorId', populate: { path: 'userId', select: 'name' } },
      { path: 'medicines.medicineId', select: 'name genericName' },
    ]);

    return success(res, prescription, 'Prescription created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const updatePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return error(res, 'Prescription not found', 404);

    const { medicines, diagnosis, notes } = req.body;
    const updated = await Prescription.findByIdAndUpdate(
      req.params.id,
      { medicines, diagnosis, notes },
      { new: true, runValidators: true }
    ).populate('medicines.medicineId', 'name genericName');

    return success(res, updated, 'Prescription updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getPrescriptions, getPrescription, createPrescription, updatePrescription };
