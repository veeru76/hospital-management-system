const express = require('express');
const { body } = require('express-validator');
const {
  getLabReports,
  getLabReport,
  createLabReport,
  updateLabReport,
} = require('../controllers/labReportController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/', getLabReports);
router.get('/:id', getLabReport);

router.post(
  '/',
  authorize('admin', 'doctor', 'staff'),
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('appointmentId').notEmpty().withMessage('Appointment ID is required'),
    body('testName').trim().notEmpty().withMessage('Test name is required'),
    body('testCategory')
      .isIn(['blood', 'urine', 'imaging', 'pathology', 'microbiology', 'other'])
      .withMessage('Invalid test category'),
  ],
  validate,
  createLabReport
);

router.put(
  '/:id',
  authorize('admin', 'doctor', 'staff'),
  [
    body('status')
      .optional()
      .isIn(['pending', 'processing', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
  ],
  validate,
  updateLabReport
);

module.exports = router;
