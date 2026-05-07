const Patient = require('../models/Patient');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');

const getPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = {};

    const patients = await Patient.find(query)
      .populate('userId', 'name email phone')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Patient.countDocuments(query);
    return success(res, { patients, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    return error(res, err.message);
  }
};

const getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('userId', 'name email phone');
    if (!patient) return error(res, 'Patient not found', 404);

    if (req.user.role === 'patient') {
      const user = await User.findById(req.user.id);
      const ownPatient = await Patient.findOne({ userId: user._id });
      if (!ownPatient || ownPatient._id.toString() !== patient._id.toString()) {
        return error(res, 'Access denied', 403);
      }
    }

    return success(res, patient);
  } catch (err) {
    return error(res, err.message);
  }
};

const getMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id }).populate('userId', 'name email phone');
    if (!patient) return error(res, 'Patient profile not found', 404);
    return success(res, patient);
  } catch (err) {
    return error(res, err.message);
  }
};

const createPatient = async (req, res) => {
  try {
    const { userId, dateOfBirth, gender, bloodGroup, address, emergencyContact, allergies, insuranceInfo } = req.body;

    const targetUserId = req.user.role === 'admin' ? userId : req.user.id;

    const existing = await Patient.findOne({ userId: targetUserId });
    if (existing) return error(res, 'Patient profile already exists for this user', 409);

    const patient = await Patient.create({
      userId: targetUserId,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContact,
      allergies,
      insuranceInfo,
    });

    await patient.populate('userId', 'name email phone');
    return success(res, patient, 'Patient profile created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return error(res, 'Patient not found', 404);

    if (req.user.role === 'patient' && patient.userId.toString() !== req.user.id) {
      return error(res, 'Access denied', 403);
    }

    const { dateOfBirth, gender, bloodGroup, address, emergencyContact, allergies, insuranceInfo } = req.body;

    const updated = await Patient.findByIdAndUpdate(
      req.params.id,
      { dateOfBirth, gender, bloodGroup, address, emergencyContact, allergies, insuranceInfo },
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone');

    return success(res, updated, 'Patient updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

const addMedicalHistory = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return error(res, 'Patient not found', 404);

    const { condition, diagnosedDate, treatment, notes } = req.body;
    patient.medicalHistory.push({ condition, diagnosedDate, treatment, notes });
    await patient.save();

    return success(res, patient.medicalHistory, 'Medical history added');
  } catch (err) {
    return error(res, err.message);
  }
};

const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return error(res, 'Patient not found', 404);
    return success(res, null, 'Patient deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  getPatients,
  getPatient,
  getMyProfile,
  createPatient,
  updatePatient,
  addMedicalHistory,
  deletePatient,
};
