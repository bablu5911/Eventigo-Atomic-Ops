const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');

class CategoryService {
  async getAllCategories() {
    return await Category.find().sort({ name: 1 });
  }

  async createCategory(categoryData) {
    const { name, description } = categoryData;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const existing = await Category.findOne({ slug });
    if (existing) {
      throw new ApiError(400, 'Category with this name already exists');
    }

    const category = await Category.create({ name, slug, description: description || '' });
    return category;
  }

  async updateCategory(categoryId, updateData) {
    if (updateData.name) {
      updateData.slug = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const category = await Category.findByIdAndUpdate(categoryId, updateData, {
      new: true,
      runValidators: true
    });

    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    return category;
  }

  async deleteCategory(categoryId) {
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    return { message: 'Category deleted successfully' };
  }
}

module.exports = new CategoryService();
