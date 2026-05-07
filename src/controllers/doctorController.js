const Doctor = require('../models/Doctor');
const { success, error } = require('../utils/apiResponse');

const getDoctors = async (req, res) => {
  try {
    const { departmentId, specialization, status = 'active', page = 1, limit = 10 } = req.query;
    const query = { status };
    if (departmentId) query.departmentId = departmentId;
    if (specialization) query.specialization = new RegExp(specialization, 'i');

    const doctors = await Doctor.find(query)
      .populate('userId', 'name email phone')
      .populate('departmentId', 'name')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Doctor.countDocuments(query);
    return success(res, { doctors, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    return error(res, err.message);
  }
};

const getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('departmentId', 'name location');
    if (!doctor) return error(res, 'Doctor not found', 404);
    return success(res, doctor);
  } catch (err) {
    return error(res, err.message);
  }
};

const getMyProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id })
      .populate('userId', 'name email phone')
      .populate('departmentId', 'name location');
    if (!doctor) return error(res, 'Doctor profile not found', 404);
    return success(res, doctor);
  } catch (err) {
    return error(res, err.message);
  }
};

const createDoctor = async (req, res) => {
  try {
    const { userId, departmentId, specialization, qualification, experience, consultationFee, availability } = req.body;

    const existing = await Doctor.findOne({ userId });
    if (existing) return error(res, 'Doctor profile already exists for this user', 409);

    const doctor = await Doctor.create({
      userId,
      departmentId,
      specialization,
      qualification,
      experience,
      consultationFee,
      availability,
    });

    await doctor.populate([
      { path: 'userId', select: 'name email phone' },
      { path: 'departmentId', select: 'name' },
    ]);

    return success(res, doctor, 'Doctor profile created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return error(res, 'Doctor not found', 404);

    if (req.user.role === 'doctor' && doctor.userId.toString() !== req.user.id) {
      return error(res, 'Access denied', 403);
    }

    const { departmentId, specialization, qualification, experience, consultationFee, availability, status } = req.body;

    const updated = await Doctor.findByIdAndUpdate(
      req.params.id,
      { departmentId, specialization, qualification, experience, consultationFee, availability, status },
      { new: true, runValidators: true }
    ).populate([
      { path: 'userId', select: 'name email phone' },
      { path: 'departmentId', select: 'name' },
    ]);

    return success(res, updated, 'Doctor updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

const updateAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return error(res, 'Doctor not found', 404);

    if (req.user.role === 'doctor' && doctor.userId.toString() !== req.user.id) {
      return error(res, 'Access denied', 403);
    }

    doctor.availability = req.body.availability;
    await doctor.save();

    return success(res, doctor.availability, 'Availability updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );
    if (!doctor) return error(res, 'Doctor not found', 404);
    return success(res, null, 'Doctor deactivated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getDoctors, getDoctor, getMyProfile, createDoctor, updateDoctor, updateAvailability, deleteDoctor };
