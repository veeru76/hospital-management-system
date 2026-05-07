const express = require('express');
const { body, query } = require('express-validator');
const {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAvailableSlots,
} = require('../controllers/appointmentController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/available-slots', getAvailableSlots);
router.get('/', getAppointments);
router.get('/:id', getAppointment);

router.post(
  '/',
  authorize('admin', 'patient', 'staff'),
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('departmentId').notEmpty().withMessage('Department ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('timeSlot.startTime').notEmpty().withMessage('Start time is required'),
    body('timeSlot.endTime').notEmpty().withMessage('End time is required'),
    body('type').optional().isIn(['in_person', 'teleconsultation', 'follow_up', 'emergency']).withMessage('Invalid type'),
  ],
  validate,
  createAppointment
);

router.put(
  '/:id',
  authorize('admin', 'doctor', 'staff'),
  [
    body('status')
      .optional()
      .isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])
      .withMessage('Invalid status'),
  ],
  validate,
  updateAppointment
);

router.patch('/:id/cancel', authorize('admin', 'doctor', 'patient', 'staff'), cancelAppointment);

module.exports = router;
