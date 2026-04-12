const Product = require('../models/Product');

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
    const { productType, variety, quantity, unit, price, description } = req.body;
    const sellerId = req.user.userId;
    const sellerRole = req.user.role;

    // Validate seller can sell this product type
    if (sellerRole === 'Farmer' && !['Coffee Cherries', 'Coffee Seedlings'].includes(productType)) {
      return res.status(400).json({ error: 'Farmers can only sell Coffee Cherries and Seedlings' });
    }

    if (sellerRole === 'Kaluppa Foundation' && !['Processed Coffee', 'Fertilizers', 'Coffee Seedlings'].includes(productType)) {
      return res.status(400).json({ error: 'Kaluppa Foundation can only sell Processed Coffee, Fertilizers, and Seedlings' });
    }

    if (!['Farmer', 'Kaluppa Foundation'].includes(sellerRole)) {
      return res.status(400).json({ error: 'Only Farmers and Kaluppa Foundation can sell' });
    }

    const newProduct = new Product({
      productType,
      variety,
      quantity,
      unit,
      sellerId,
      sellerRole,
      price,
      description
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

    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const buyProduct = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient quantity' });
    }

    // Reduce quantity
    product.quantity -= quantity;

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
