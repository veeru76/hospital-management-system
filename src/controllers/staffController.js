const Staff = require('../models/Staff');
const { success, error } = require('../utils/apiResponse');

const getStaffMembers = async (req, res) => {
  try {
    const { page = 1, limit = 10, departmentId, position, shift, isActive } = req.query;
    const query = {};

    if (departmentId) query.departmentId = departmentId;
    if (position) query.position = position;
    if (shift) query.shift = shift;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const staffList = await Staff.find(query)
      .populate('userId', 'name email phone')
      .populate('departmentId', 'name')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Staff.countDocuments(query);
    return success(res, { staff: staffList, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    return error(res, err.message);
  }
};

const getStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('departmentId', 'name');

    if (!staff) return error(res, 'Staff member not found', 404);

    if (req.user.role === 'staff' && staff.userId._id.toString() !== req.user.id) {
      return error(res, 'Access denied', 403);
    }

    return success(res, staff);
  } catch (err) {
    return error(res, err.message);
  }
};

const getMyProfile = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user.id })
      .populate('userId', 'name email phone')
      .populate('departmentId', 'name');

    if (!staff) return error(res, 'Staff profile not found', 404);
    return success(res, staff);
  } catch (err) {
    return error(res, err.message);
  }
};

const createStaff = async (req, res) => {
  try {
    const { userId, departmentId, position, shift, joiningDate, salary } = req.body;

    const existing = await Staff.findOne({ userId });
    if (existing) return error(res, 'Staff profile already exists for this user', 409);

    const staff = await Staff.create({ userId, departmentId, position, shift, joiningDate, salary });
    await staff.populate([
      { path: 'userId', select: 'name email phone' },
      { path: 'departmentId', select: 'name' },
    ]);

    return success(res, staff, 'Staff profile created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const updateStaff = async (req, res) => {
  try {
    const { departmentId, position, shift, salary, isActive } = req.body;
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { departmentId, position, shift, salary, isActive },
      { new: true, runValidators: true }
    ).populate([
      { path: 'userId', select: 'name email phone' },
      { path: 'departmentId', select: 'name' },
    ]);

    if (!staff) return error(res, 'Staff member not found', 404);
    return success(res, staff, 'Staff updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!staff) return error(res, 'Staff member not found', 404);
    return success(res, null, 'Staff member deactivated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getStaffMembers, getStaff, getMyProfile, createStaff, updateStaff, deleteStaff };
