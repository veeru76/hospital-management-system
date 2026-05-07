const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { success, error } = require('../utils/apiResponse');

const getAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, date, doctorId, patientId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }

    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (!doctor) return error(res, 'Doctor profile not found', 404);
      query.doctorId = doctor._id;
    } else if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient) return error(res, 'Patient profile not found', 404);
      query.patientId = patient._id;
    } else {
      if (doctorId) query.doctorId = doctorId;
      if (patientId) query.patientId = patientId;
    }

    const appointments = await Appointment.find(query)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email phone' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .populate('departmentId', 'name')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ date: -1 });

    const total = await Appointment.countDocuments(query);
    return success(res, { appointments, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    return error(res, err.message);
  }
};

const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email phone' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .populate('departmentId', 'name');

    if (!appointment) return error(res, 'Appointment not found', 404);

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient || appointment.patientId._id.toString() !== patient._id.toString()) {
        return error(res, 'Access denied', 403);
      }
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (!doctor || appointment.doctorId._id.toString() !== doctor._id.toString()) {
        return error(res, 'Access denied', 403);
      }
    }

    return success(res, appointment);
  } catch (err) {
    return error(res, err.message);
  }
};

const createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, departmentId, date, timeSlot, type, reason } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.status !== 'active') return error(res, 'Doctor is not available', 400);

    const conflict = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      'timeSlot.startTime': timeSlot.startTime,
      status: { $in: ['scheduled', 'confirmed'] },
    });
    if (conflict) return error(res, 'This time slot is already booked', 409);

    const appointment = await Appointment.create({ patientId, doctorId, departmentId, date, timeSlot, type, reason });

    await appointment.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'name email' } },
      { path: 'doctorId', populate: { path: 'userId', select: 'name' } },
      { path: 'departmentId', select: 'name' },
    ]);

    return success(res, appointment, 'Appointment booked successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return error(res, 'Appointment not found', 404);

    const { status, notes, date, timeSlot, type } = req.body;
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, notes, date, timeSlot, type },
      { new: true, runValidators: true }
    ).populate([
      { path: 'patientId', populate: { path: 'userId', select: 'name email' } },
      { path: 'doctorId', populate: { path: 'userId', select: 'name' } },
      { path: 'departmentId', select: 'name' },
    ]);

    return success(res, updated, 'Appointment updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return error(res, 'Appointment not found', 404);

    if (['completed', 'cancelled'].includes(appointment.status)) {
      return error(res, `Cannot cancel an appointment that is already ${appointment.status}`, 400);
    }

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient || appointment.patientId.toString() !== patient._id.toString()) {
        return error(res, 'Access denied', 403);
      }
    }

    appointment.status = 'cancelled';
    await appointment.save();

    return success(res, null, 'Appointment cancelled successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) return error(res, 'doctorId and date are required', 400);

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return error(res, 'Doctor not found', 404);

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const availability = doctor.availability.find((a) => a.day === dayOfWeek);
    if (!availability) return success(res, { slots: [] });

    const bookedAppointments = await Appointment.find({
      doctorId,
      date: new Date(date),
      status: { $in: ['scheduled', 'confirmed'] },
    }).select('timeSlot');

    const bookedSlots = bookedAppointments.map((a) => a.timeSlot.startTime);

    const slots = [];
    const [startH, startM] = availability.startTime.split(':').map(Number);
    const [endH, endM] = availability.endTime.split(':').map(Number);
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (current + 30 <= end) {
      const hh = String(Math.floor(current / 60)).padStart(2, '0');
      const mm = String(current % 60).padStart(2, '0');
      const startTime = `${hh}:${mm}`;
      const nextH = String(Math.floor((current + 30) / 60)).padStart(2, '0');
      const nextM = String((current + 30) % 60).padStart(2, '0');
      const endTime = `${nextH}:${nextM}`;

      slots.push({ startTime, endTime, isBooked: bookedSlots.includes(startTime) });
      current += 30;
    }

    return success(res, { slots });
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAvailableSlots,
};
