const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const catchAsync = require('../middlewares/catchAsync');
const { categorySchema } = require('../validations/categoryValidation');

router.get('/', catchAsync(categoryController.getAllCategories));
router.post('/', auth, authorize('admin', 'superadmin'), validate(categorySchema), catchAsync(categoryController.createCategory));
router.put('/:id', auth, authorize('admin', 'superadmin'), validate(categorySchema), catchAsync(categoryController.updateCategory));
router.delete('/:id', auth, authorize('admin', 'superadmin'), catchAsync(categoryController.deleteCategory));

module.exports = router;
