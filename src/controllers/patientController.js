const Patient = require('../models/Patient');
const { success, error } = require('../utils/apiResponse');

const getPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const patients = await Patient.find()
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Patient.countDocuments();
    return success(res, { patients, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    return error(res, err.message);
  }
};

const getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return error(res, 'Patient not found', 404);
    return success(res, patient);
  } catch (err) {
    return error(res, err.message);
  }
};

const createPatient = async (req, res) => {
  try {
    const { name, email, phone, dateOfBirth, gender, bloodGroup, address, emergencyContact, allergies } = req.body;

    const patient = await Patient.create({
      name, email, phone, dateOfBirth, gender, bloodGroup, address, emergencyContact, allergies,
    });

    return success(res, patient, 'Patient created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return error(res, 'Patient not found', 404);

    const { name, email, phone, dateOfBirth, gender, bloodGroup, address, emergencyContact, allergies } = req.body;

    const updated = await Patient.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, dateOfBirth, gender, bloodGroup, address, emergencyContact, allergies },
      { new: true, runValidators: true }
    );

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

module.exports = { getPatients, getPatient, createPatient, updatePatient, addMedicalHistory, deletePatient };
