const crypto = require('crypto');

const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

const CANCELLATION_FEE_RATE = 0.05;

const buildOrderId = () => {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${Date.now()}-${random}`;
};

const checkoutOrder = async (req, res) => {
  try {
    const buyerId = req.user.userId;
    const cartItems = Array.isArray(req.body.items) ? req.body.items : [];

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const buyer = await User.findById(buyerId).select('role isVerified fullname');
    if (!buyer || !['Buyer', 'Farmer', 'Kaluppa Foundation'].includes(buyer.role)) {
      return res.status(403).json({ error: 'Only Buyer, Farmer, and Kaluppa Foundation accounts can checkout' });
    }

    const sanitized = cartItems
      .map((item) => ({ productId: item.productId, quantity: Number(item.quantity) }))
      .filter((item) => item.productId && item.quantity > 0);

    if (sanitized.length === 0) {
      return res.status(400).json({ error: 'No valid cart items to checkout' });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const item of sanitized) {
      const product = await Product.findById(item.productId).populate('sellerId', 'fullname');

      if (!product) {
        return res.status(404).json({ error: 'One or more products are no longer available' });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.productType}` });
      }

      product.quantity -= item.quantity;
      await product.save();

      if (product.quantity === 0) {
        await Product.findByIdAndDelete(product._id);
      }

      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        productId: product._id,
        productType: product.productType,
        variety: product.variety || '',
        quantity: item.quantity,
        unit: product.unit,
        saleType: product.saleType || 'Retail',
        price: product.price,
        sellerId: product.sellerId?._id || product.sellerId,
        sellerName: product.sellerId?.fullname || 'Unknown Seller',
        sellerRole: product.sellerRole || 'Farmer',
        processingBadge: product.processingBadge || '',
      });
    }

    const order = new Order({
      orderId: buildOrderId(),
      buyerId,
      items: orderItems,
      subtotal,
      status: 'Pending',
    });

    await order.save();

    return res.status(201).json({
      message: 'Checkout successful',
      order,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let orders = [];

    if (['Kaluppa Foundation', 'DTI'].includes(role)) {
      orders = await Order.find().sort({ createdAt: -1 });
    } else if (role === 'Buyer' || role === 'Farmer') {
      orders = await Order.find({ buyerId: userId }).sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ 'items.sellerId': userId }).sort({ createdAt: -1 });
    }

    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;
    const role = req.user.role;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending orders can be cancelled' });
    }

    const isBuyer = String(order.buyerId) === String(userId);
    const isAdmin = ['Kaluppa Foundation', 'DTI'].includes(role);

    if (!isBuyer && !isAdmin) {
      return res.status(403).json({ error: 'Only the buyer or admins can cancel this order' });
    }

    order.status = 'Cancelled';
    order.cancelledBy = userId;
    order.cancelReason = reason || 'No reason provided';
    order.cancellationFee = Number((order.subtotal * CANCELLATION_FEE_RATE).toFixed(2));
    order.updatedAt = new Date();

    await order.save();

    for (const item of order.items) {
      const existingProduct = await Product.findById(item.productId);

      if (existingProduct) {
        existingProduct.quantity += item.quantity;
        await existingProduct.save();
        continue;
      }

      await Product.create({
        _id: item.productId,
        productType: item.productType,
        variety: item.variety,
        quantity: item.quantity,
        unit: item.unit,
        saleType: item.saleType,
        sellerId: item.sellerId,
        sellerRole: item.sellerRole,
        price: item.price,
        description: 'Restored from cancelled order',
        processingBadge: item.processingBadge || undefined,
      });
    }

    return res.status(200).json({
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  checkoutOrder,
  getMyOrders,
  cancelOrder,
};
