const express = require('express');
const { body } = require('express-validator');
const {
  getMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  updateStock,
  deleteMedicine,
} = require('../controllers/medicineController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/', getMedicines);
router.get('/:id', getMedicine);

router.post(
  '/',
  authorize('admin', 'staff'),
  [
    body('name').trim().notEmpty().withMessage('Medicine name is required'),
    body('category')
      .isIn(['antibiotic', 'analgesic', 'antiviral', 'antifungal', 'antihypertensive', 'antidiabetic', 'vitamin', 'supplement', 'other'])
      .withMessage('Invalid category'),
    body('price').isNumeric({ min: 0 }).withMessage('Valid price is required'),
    body('stock').isInt({ min: 0 }).withMessage('Valid stock quantity is required'),
    body('expiryDate').isISO8601().withMessage('Valid expiry date is required'),
  ],
  validate,
  createMedicine
);

router.put('/:id', authorize('admin', 'staff'), updateMedicine);

router.patch(
  '/:id/stock',
  authorize('admin', 'staff'),
  [
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('operation').isIn(['add', 'subtract']).withMessage('Operation must be "add" or "subtract"'),
  ],
  validate,
  updateStock
);

router.delete('/:id', authorize('admin'), deleteMedicine);

module.exports = router;
