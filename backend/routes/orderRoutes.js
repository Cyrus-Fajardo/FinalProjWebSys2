const express = require('express');
const { checkoutOrder, getMyOrders, cancelOrder } = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', authMiddleware, roleMiddleware(['Buyer', 'Farmer', 'Kaluppa Foundation', 'DTI', 'Group Manager']), getMyOrders);
router.post('/checkout', authMiddleware, roleMiddleware(['Buyer', 'Farmer', 'Kaluppa Foundation']), checkoutOrder);
router.patch('/:orderId/cancel', authMiddleware, roleMiddleware(['Buyer', 'Farmer', 'Kaluppa Foundation', 'DTI']), cancelOrder);

module.exports = router;
