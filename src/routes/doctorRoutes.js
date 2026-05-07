const express = require('express');
const { body } = require('express-validator');
const {
  getDoctors,
  getDoctor,
  getMyProfile,
  createDoctor,
  updateDoctor,
  updateAvailability,
  deleteDoctor,
} = require('../controllers/doctorController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/me', authorize('doctor'), getMyProfile);
router.get('/', getDoctors);
router.get('/:id', getDoctor);

router.post(
  '/',
  authorize('admin'),
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('departmentId').notEmpty().withMessage('Department ID is required'),
    body('specialization').trim().notEmpty().withMessage('Specialization is required'),
    body('consultationFee').isNumeric({ min: 0 }).withMessage('Valid consultation fee is required'),
  ],
  validate,
  createDoctor
);

router.put(
  '/:id',
  authorize('admin', 'doctor'),
  [
    body('consultationFee').optional().isNumeric({ min: 0 }).withMessage('Invalid consultation fee'),
    body('status').optional().isIn(['active', 'on_leave', 'inactive']).withMessage('Invalid status'),
  ],
  validate,
  updateDoctor
);

router.put(
  '/:id/availability',
  authorize('admin', 'doctor'),
  [body('availability').isArray().withMessage('Availability must be an array')],
  validate,
  updateAvailability
);

router.delete('/:id', authorize('admin'), deleteDoctor);

module.exports = router;
