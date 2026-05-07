const express = require('express');
const { body } = require('express-validator');
const {
  getStaffMembers,
  getStaff,
  getMyProfile,
  createStaff,
  updateStaff,
  deleteStaff,
} = require('../controllers/staffController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/me', authorize('staff'), getMyProfile);
router.get('/', authorize('admin'), getStaffMembers);
router.get('/:id', authorize('admin', 'staff'), getStaff);

router.post(
  '/',
  authorize('admin'),
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('departmentId').notEmpty().withMessage('Department ID is required'),
    body('position')
      .isIn(['nurse', 'receptionist', 'lab_technician', 'pharmacist', 'accountant', 'cleaner', 'security', 'other'])
      .withMessage('Invalid position'),
    body('shift')
      .isIn(['morning', 'afternoon', 'night', 'rotating'])
      .withMessage('Invalid shift'),
    body('joiningDate').isISO8601().withMessage('Valid joining date is required'),
    body('salary').isNumeric({ min: 0 }).withMessage('Valid salary is required'),
  ],
  validate,
  createStaff
);

router.put(
  '/:id',
  authorize('admin'),
  [
    body('position')
      .optional()
      .isIn(['nurse', 'receptionist', 'lab_technician', 'pharmacist', 'accountant', 'cleaner', 'security', 'other'])
      .withMessage('Invalid position'),
    body('shift').optional().isIn(['morning', 'afternoon', 'night', 'rotating']).withMessage('Invalid shift'),
  ],
  validate,
  updateStaff
);

router.delete('/:id', authorize('admin'), deleteStaff);

module.exports = router;
