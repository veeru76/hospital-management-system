const express = require('express');
const { body } = require('express-validator');
const { getPatients, getPatient, createPatient, updatePatient, addMedicalHistory, deletePatient } = require('../controllers/patientController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/',    authorize('admin', 'doctor', 'staff'), getPatients);
router.get('/:id', authorize('admin', 'doctor', 'staff'), getPatient);

router.post(
  '/',
  authorize('admin', 'staff'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  ],
  validate,
  createPatient
);

router.put(
  '/:id',
  authorize('admin', 'staff'),
  [body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender')],
  validate,
  updatePatient
);

router.post(
  '/:id/medical-history',
  authorize('admin', 'doctor'),
  [body('condition').trim().notEmpty().withMessage('Condition is required')],
  validate,
  addMedicalHistory
);

router.delete('/:id', authorize('admin'), deletePatient);

module.exports = router;
