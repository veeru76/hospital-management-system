const Department = require('../models/Department');
const { success, error } = require('../utils/apiResponse');

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).populate('headDoctorId', 'userId specialization');
    return success(res, departments);
  } catch (err) {
    return error(res, err.message);
  }
};

const getDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id).populate('headDoctorId', 'userId specialization');
    if (!department) return error(res, 'Department not found', 404);
    return success(res, department);
  } catch (err) {
    return error(res, err.message);
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, description, location, phone } = req.body;
    const department = await Department.create({ name, description, location, phone });
    return success(res, department, 'Department created successfully', 201);
  } catch (err) {
    if (err.code === 11000) return error(res, 'Department name already exists', 409);
    return error(res, err.message);
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { name, description, location, phone, headDoctorId, isActive } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description, location, phone, headDoctorId, isActive },
      { new: true, runValidators: true }
    );
    if (!department) return error(res, 'Department not found', 404);
    return success(res, department, 'Department updated successfully');
  } catch (err) {
    if (err.code === 11000) return error(res, 'Department name already exists', 409);
    return error(res, err.message);
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!department) return error(res, 'Department not found', 404);
    return success(res, null, 'Department deactivated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment };
