const Product = require('../models/Product');
const Seller = require('../models/Seller');
const Order = require('../models/Order');

const SELLABLE_TYPES_BY_ROLE = {
  Farmer: ['Coffee Cherries', 'Processed Coffee', 'Coffee Seedlings'],
  'Kaluppa Foundation': ['Coffee Seedlings', 'Processed Coffee', 'Fertilizers'],
};

const inventoryFieldByProductType = {
  'Coffee Cherries': 'harvestDetails.coffeeCherriesKg',
  'Processed Coffee': 'processDetails.processedCoffeeKg',
  'Coffee Seedlings': 'harvestDetails.coffeeSeedlingsCount',
  Fertilizers: 'inventoryDetails.fertilizerBags',
};

const resolveProcessingBadge = (productType, sellerRole) => {
  if (productType !== 'Processed Coffee') {
    return undefined;
  }

  return sellerRole === 'Kaluppa Foundation' ? 'foundation-verified' : 'self-processed';
};

const getNestedNumericValue = (obj, path) => {
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc ? acc[key] : undefined), obj) || 0;
};

const incrementSellerInventory = async (sellerId, productType, quantity) => {
  const inventoryField = inventoryFieldByProductType[productType];

  if (!inventoryField) {
    return;
  }

  await Seller.findOneAndUpdate(
    { userId: sellerId },
    { $inc: { [inventoryField]: quantity }, $set: { updatedAt: new Date() } }
  );
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('sellerId', 'fullname email');
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { productType, variety, quantity, unit, price, description, saleType } = req.body;
    const sellerId = req.user.userId;
    const sellerRole = req.user.role;
    const numericQuantity = Number(quantity);

    if (!SELLABLE_TYPES_BY_ROLE[sellerRole]) {
      return res.status(400).json({ error: 'Only Farmers and Kaluppa Foundation can sell' });
    }

    if (!SELLABLE_TYPES_BY_ROLE[sellerRole].includes(productType)) {
      return res.status(400).json({ error: 'Selected product type is not allowed for your role' });
    }

    if (!numericQuantity || numericQuantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than zero' });
    }

    const sellerProfile = await Seller.findOne({ userId: sellerId });

    if (!sellerProfile) {
      return res.status(400).json({ error: 'Create your seller profile first before listing products' });
    }

    const inventoryField = inventoryFieldByProductType[productType];
    const availableQty = getNestedNumericValue(sellerProfile, inventoryField);

    if (availableQty < numericQuantity) {
      return res.status(400).json({
        error: `Insufficient inventory. Available: ${availableQty}`,
      });
    }

    await Seller.findOneAndUpdate(
      { userId: sellerId },
      { $inc: { [inventoryField]: -numericQuantity }, $set: { updatedAt: new Date() } }
    );

    const newProduct = new Product({
      productType,
      variety,
      quantity: numericQuantity,
      unit,
      sellerId,
      sellerRole,
      price,
      description,
      saleType: saleType === 'Wholesale' ? 'Wholesale' : 'Retail',
      processingBadge: resolveProcessingBadge(productType, sellerRole),
    });

    await newProduct.save();

    res.status(201).json({
      message: 'Product added successfully',
      product: newProduct
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (String(product.sellerId) !== String(req.user.userId)) {
      return res.status(403).json({ error: 'You can only cancel your own listing' });
    }

    const hasExistingOrder = await Order.exists({
      'items.productId': product._id,
      status: { $in: ['Pending', 'Completed'] },
    });

    if (hasExistingOrder) {
      return res.status(400).json({ error: 'Cannot cancel listing because it is already part of an order' });
    }

    await incrementSellerInventory(product.sellerId, product.productType, product.quantity);
    await Product.findByIdAndDelete(productId);

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const buyProduct = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const numericQuantity = Number(quantity);

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!numericQuantity || numericQuantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than zero' });
    }

    if (product.quantity < numericQuantity) {
      return res.status(400).json({ error: 'Insufficient quantity' });
    }

    // Reduce quantity
    product.quantity -= numericQuantity;

    // If quantity is 0, delete the product
    if (product.quantity === 0) {
      await Product.findByIdAndDelete(productId);
    } else {
      await product.save();
    }

    res.status(200).json({
      message: 'Product purchased successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllProducts, createProduct, deleteProduct, buyProduct };
