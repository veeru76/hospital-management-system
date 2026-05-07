const express = require('express');
const { body } = require('express-validator');
const {
  getBillings,
  getBilling,
  createBilling,
  updatePaymentStatus,
  getBillingSummary,
} = require('../controllers/billingController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/summary', authorize('admin', 'staff'), getBillingSummary);
router.get('/', authorize('admin', 'staff', 'patient'), getBillings);
router.get('/:id', authorize('admin', 'staff', 'patient'), getBilling);

router.post(
  '/',
  authorize('admin', 'staff'),
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('appointmentId').notEmpty().withMessage('Appointment ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one billing item is required'),
    body('items.*.description').notEmpty().withMessage('Item description is required'),
    body('items.*.amount').isNumeric({ min: 0 }).withMessage('Item amount must be a positive number'),
    body('items.*.quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ],
  validate,
  createBilling
);

router.patch(
  '/:id/payment',
  authorize('admin', 'staff'),
  [
    body('paymentStatus')
      .isIn(['pending', 'paid', 'partial', 'refunded', 'cancelled'])
      .withMessage('Invalid payment status'),
    body('paymentMethod')
      .optional()
      .isIn(['cash', 'card', 'upi', 'insurance', 'online'])
      .withMessage('Invalid payment method'),
  ],
  validate,
  updatePaymentStatus
);

module.exports = router;
