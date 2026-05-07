const LabReport = require('../models/LabReport');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { success, error } = require('../utils/apiResponse');

const getLabReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId, status } = req.query;
    const query = {};

    if (status) query.status = status;

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

    const reports = await LabReport.find(query)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .populate('appointmentId', 'appointmentNo date')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await LabReport.countDocuments(query);
    return success(res, { reports, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    return error(res, err.message);
  }
};

const getLabReport = async (req, res) => {
  try {
    const report = await LabReport.findById(req.params.id)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .populate('appointmentId', 'appointmentNo date');

    if (!report) return error(res, 'Lab report not found', 404);

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient || report.patientId._id.toString() !== patient._id.toString()) {
        return error(res, 'Access denied', 403);
      }
    }

    return success(res, report);
  } catch (err) {
    return error(res, err.message);
  }
};

const createLabReport = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentId, testName, testCategory, results, remarks, conductedAt } = req.body;

    const report = await LabReport.create({
      patientId,
      doctorId,
      appointmentId,
      testName,
      testCategory,
      results,
      remarks,
      conductedAt,
    });

    await report.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'name' } },
      { path: 'doctorId', populate: { path: 'userId', select: 'name' } },
    ]);

    return success(res, report, 'Lab report created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const updateLabReport = async (req, res) => {
  try {
    const report = await LabReport.findById(req.params.id);
    if (!report) return error(res, 'Lab report not found', 404);

    const { results, status, remarks } = req.body;
    const updated = await LabReport.findByIdAndUpdate(
      req.params.id,
      { results, status, remarks },
      { new: true, runValidators: true }
    );

    return success(res, updated, 'Lab report updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getLabReports, getLabReport, createLabReport, updateLabReport };
