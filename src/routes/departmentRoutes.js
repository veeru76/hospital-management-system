const express = require('express');
const { body } = require('express-validator');
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/', getDepartments);
router.get('/:id', getDepartment);

router.post(
  '/',
  authorize('admin'),
  [body('name').trim().notEmpty().withMessage('Department name is required')],
  validate,
  createDepartment
);

router.put(
  '/:id',
  authorize('admin'),
  [body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')],
  validate,
  updateDepartment
);

router.delete('/:id', authorize('admin'), deleteDepartment);

module.exports = router;
