const express = require('express');
const { body } = require('express-validator');
const {
  getPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
} = require('../controllers/prescriptionController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/', getPrescriptions);
router.get('/:id', getPrescription);

router.post(
  '/',
  authorize('admin', 'doctor'),
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('appointmentId').notEmpty().withMessage('Appointment ID is required'),
    body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required'),
    body('medicines').isArray({ min: 1 }).withMessage('At least one medicine is required'),
    body('medicines.*.medicineId').notEmpty().withMessage('Medicine ID is required'),
    body('medicines.*.dosage').notEmpty().withMessage('Dosage is required'),
    body('medicines.*.frequency').notEmpty().withMessage('Frequency is required'),
    body('medicines.*.duration').notEmpty().withMessage('Duration is required'),
  ],
  validate,
  createPrescription
);

router.put(
  '/:id',
  authorize('admin', 'doctor'),
  [body('diagnosis').optional().trim().notEmpty().withMessage('Diagnosis cannot be empty')],
  validate,
  updatePrescription
);

module.exports = router;
