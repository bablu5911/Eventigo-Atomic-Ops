const categoryService = require('../services/categoryService');

const getAllCategories = async (req, res) => {
  const categories = await categoryService.getAllCategories();
  res.status(200).json({
    success: true,
    categories
  });
};

const createCategory = async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json({
    success: true,
    category
  });
};

const updateCategory = async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.status(200).json({
    success: true,
    category
  });
};

const deleteCategory = async (req, res) => {
  const result = await categoryService.deleteCategory(req.params.id);
  res.status(200).json({
    success: true,
    message: result.message
  });
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
