const Room = require('../models/Room');
const { success, error } = require('../utils/apiResponse');

const getRooms = async (req, res) => {
  try {
    const { type, status, departmentId, floor, page = 1, limit = 10 } = req.query;
    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (departmentId) query.departmentId = departmentId;
    if (floor) query.floor = Number(floor);

    const rooms = await Room.find(query)
      .populate('departmentId', 'name')
      .populate('beds.patientId', 'patientId')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ roomNumber: 1 });

    const total = await Room.countDocuments(query);
    return success(res, { rooms, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    return error(res, err.message);
  }
};

const getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('departmentId', 'name')
      .populate('beds.patientId', 'patientId userId');

    if (!room) return error(res, 'Room not found', 404);
    return success(res, room);
  } catch (err) {
    return error(res, err.message);
  }
};

const createRoom = async (req, res) => {
  try {
    const { roomNumber, departmentId, type, floor, beds, ratePerDay } = req.body;

    const room = await Room.create({ roomNumber, departmentId, type, floor, beds, ratePerDay });
    await room.populate('departmentId', 'name');

    return success(res, room, 'Room created successfully', 201);
  } catch (err) {
    if (err.code === 11000) return error(res, 'Room number already exists', 409);
    return error(res, err.message);
  }
};

const updateRoom = async (req, res) => {
  try {
    const { type, floor, ratePerDay, status, departmentId } = req.body;
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { type, floor, ratePerDay, status, departmentId },
      { new: true, runValidators: true }
    ).populate('departmentId', 'name');

    if (!room) return error(res, 'Room not found', 404);
    return success(res, room, 'Room updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

const assignBed = async (req, res) => {
  try {
    const { bedNo, patientId } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return error(res, 'Room not found', 404);

    const bed = room.beds.find((b) => b.bedNo === bedNo);
    if (!bed) return error(res, 'Bed not found', 404);
    if (bed.isOccupied) return error(res, 'Bed is already occupied', 400);

    bed.isOccupied = true;
    bed.patientId = patientId;

    const allOccupied = room.beds.every((b) => b.isOccupied);
    if (allOccupied) room.status = 'occupied';

    await room.save();
    return success(res, room, 'Bed assigned successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

const releaseBed = async (req, res) => {
  try {
    const { bedNo } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return error(res, 'Room not found', 404);

    const bed = room.beds.find((b) => b.bedNo === bedNo);
    if (!bed) return error(res, 'Bed not found', 404);
    if (!bed.isOccupied) return error(res, 'Bed is not occupied', 400);

    bed.isOccupied = false;
    bed.patientId = null;

    if (room.status === 'occupied') room.status = 'available';

    await room.save();
    return success(res, room, 'Bed released successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return error(res, 'Room not found', 404);
    return success(res, null, 'Room deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getRooms, getRoom, createRoom, updateRoom, assignBed, releaseBed, deleteRoom };
