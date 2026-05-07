const express = require('express');
const { body } = require('express-validator');
const {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  assignBed,
  releaseBed,
  deleteRoom,
} = require('../controllers/roomController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin', 'doctor', 'staff'));

router.get('/', getRooms);
router.get('/:id', getRoom);

router.post(
  '/',
  authorize('admin'),
  [
    body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
    body('departmentId').notEmpty().withMessage('Department ID is required'),
    body('type')
      .isIn(['general', 'private', 'icu', 'emergency', 'operation_theatre', 'laboratory'])
      .withMessage('Invalid room type'),
    body('floor').isInt({ min: 0 }).withMessage('Valid floor number is required'),
    body('ratePerDay').isNumeric({ min: 0 }).withMessage('Valid rate per day is required'),
  ],
  validate,
  createRoom
);

router.put(
  '/:id',
  authorize('admin'),
  [
    body('status')
      .optional()
      .isIn(['available', 'occupied', 'maintenance', 'reserved'])
      .withMessage('Invalid status'),
  ],
  validate,
  updateRoom
);

router.patch(
  '/:id/assign-bed',
  [
    body('bedNo').notEmpty().withMessage('Bed number is required'),
    body('patientId').notEmpty().withMessage('Patient ID is required'),
  ],
  validate,
  assignBed
);

router.patch(
  '/:id/release-bed',
  [body('bedNo').notEmpty().withMessage('Bed number is required')],
  validate,
  releaseBed
);

router.delete('/:id', authorize('admin'), deleteRoom);

module.exports = router;
