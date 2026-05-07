const Medicine = require('../models/Medicine');
const { success, error } = require('../utils/apiResponse');

const getMedicines = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, lowStock } = req.query;
    const query = {};

    if (category) query.category = category;
    if (search) query.name = new RegExp(search, 'i');
    if (lowStock === 'true') query.stock = { $lte: 10 };

    const medicines = await Medicine.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ name: 1 });

    const total = await Medicine.countDocuments(query);
    return success(res, { medicines, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    return error(res, err.message);
  }
};

const getMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return error(res, 'Medicine not found', 404);
    return success(res, medicine);
  } catch (err) {
    return error(res, err.message);
  }
};

const createMedicine = async (req, res) => {
  try {
    const { name, genericName, category, manufacturer, price, stock, expiryDate, requiresPrescription } = req.body;

    const medicine = await Medicine.create({
      name,
      genericName,
      category,
      manufacturer,
      price,
      stock,
      expiryDate,
      requiresPrescription,
    });

    return success(res, medicine, 'Medicine added successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!medicine) return error(res, 'Medicine not found', 404);
    return success(res, medicine, 'Medicine updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

const updateStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body;
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return error(res, 'Medicine not found', 404);

    if (operation === 'add') {
      medicine.stock += quantity;
    } else if (operation === 'subtract') {
      if (medicine.stock < quantity) return error(res, 'Insufficient stock', 400);
      medicine.stock -= quantity;
    } else {
      return error(res, 'Operation must be "add" or "subtract"', 400);
    }

    await medicine.save();
    return success(res, { stock: medicine.stock }, 'Stock updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) return error(res, 'Medicine not found', 404);
    return success(res, null, 'Medicine deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getMedicines, getMedicine, createMedicine, updateMedicine, updateStock, deleteMedicine };
