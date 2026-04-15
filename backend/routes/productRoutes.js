const express = require('express');
const { getAllProducts, createProduct, deleteProduct, buyProduct } = require('../controllers/productController');
const { authMiddleware } = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Get all products - public for window-shopping
router.get('/', getAllProducts);

// Create product - only Farmers and Kaluppa Foundation can sell
router.post('/', authMiddleware, roleMiddleware(['Farmer', 'Kaluppa Foundation']), createProduct);

// Buy product - Kaluppa Foundation, Farmers, and Buyers can buy
router.post('/buy', authMiddleware, roleMiddleware(['Kaluppa Foundation', 'Farmer', 'Buyer']), buyProduct);

// Delete product (seller only)
router.delete('/:productId', authMiddleware, roleMiddleware(['Farmer', 'Kaluppa Foundation']), deleteProduct);

module.exports = router;
