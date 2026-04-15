const jwt = require('jsonwebtoken');

const connectToDatabase = require('../config/db');
const { applyCorsHeaders, sendJson, handleOptions } = require('../utils/http');
const { ApiError, login, register, refresh, logout, logoutAll, changePassword } = require('../controllers/authController');
const User = require('../models/User');
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getMyProfile,
  updateMyProfile,
  submitVerification,
} = require('../controllers/userController');
const { getAllProducts, createProduct, deleteProduct, buyProduct } = require('../controllers/productController');
const { checkoutOrder, getMyOrders, cancelOrder } = require('../controllers/orderController');
const {
  getFarmerProfile,
  getAllFarmers,
  updateFarmerProfile,
  createFarmerProfile,
  batchUpdateFarmers,
} = require('../controllers/farmerController');

const allowedRoleMap = {
  users: ['Kaluppa Foundation', 'DTI'],
  productsRead: ['Kaluppa Foundation', 'Farmer', 'Buyer'],
  productsWrite: ['Farmer', 'Kaluppa Foundation'],
  productsBuy: ['Kaluppa Foundation', 'Farmer', 'Buyer'],
  ordersRead: ['Kaluppa Foundation', 'DTI', 'Group Manager', 'Farmer', 'Buyer'],
  ordersWrite: ['Kaluppa Foundation', 'Farmer', 'Buyer'],
  ordersCancel: ['Kaluppa Foundation', 'DTI', 'Farmer', 'Buyer'],
  farmersRead: ['Kaluppa Foundation', 'DTI', 'Group Manager', 'Farmer'],
  farmersWrite: ['Kaluppa Foundation', 'DTI', 'Farmer'],
  farmersAdmin: ['Kaluppa Foundation', 'DTI', 'Group Manager'],
};

const getPathSegments = (req) => {
  const url = new URL(req.url, 'http://localhost');
  return url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
};

const getBearerToken = (req) => {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  return header.slice(7);
};

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new ApiError('JWT secret is not configured', 500);
  }

  return process.env.JWT_SECRET;
};

const attachUser = async (req) => {
  const token = getBearerToken(req);

  if (!token) {
    throw new ApiError('No token provided', 401);
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    const user = await User.findById(decoded.userId).select('tokenVersion');

    if (!user) {
      throw new ApiError('Invalid token', 401);
    }

    if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
      throw new ApiError('Token no longer valid', 401);
    }

    req.user = decoded;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error.name === 'TokenExpiredError') {
      throw new ApiError('Token expired', 401);
    }

    throw new ApiError('Invalid token', 401);
  }
};

const requireRole = (req, roles) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError('Access denied', 403);
  }
};

const runController = async (controller, req, res) => {
  await controller(req, res);
};

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  applyCorsHeaders(res);

  const segments = getPathSegments(req);

  try {
    await connectToDatabase();

    if (segments.length === 0) {
      return sendJson(res, 404, { error: 'Not Found' });
    }

    const [resource, idOrAction, nestedAction] = segments;

    if (resource === 'login') {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });
      return runController(login, req, res);
    }

    if (resource === 'register') {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });
      return runController(register, req, res);
    }

    if (resource === 'refresh') {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });
      return runController(refresh, req, res);
    }

    if (resource === 'logout') {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });
      await attachUser(req);
      return runController(logout, req, res);
    }

    if (resource === 'logout-all') {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });
      await attachUser(req);
      return runController(logoutAll, req, res);
    }

    if (resource === 'change-password') {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });
      await attachUser(req);
      return runController(changePassword, req, res);
    }

    if (resource === 'users') {
      await attachUser(req);
      req.params = req.params || {};
      req.params.userId = idOrAction;

      if (segments.length === 2 && idOrAction === 'me' && req.method === 'GET') {
        return runController(getMyProfile, req, res);
      }

      if (segments.length === 2 && idOrAction === 'me' && req.method === 'PATCH') {
        return runController(updateMyProfile, req, res);
      }

      if (segments.length === 3 && idOrAction === 'me' && nestedAction === 'verify' && req.method === 'PATCH') {
        return runController(submitVerification, req, res);
      }

      requireRole(req, allowedRoleMap.users);

      if (segments.length === 1 && req.method === 'GET') return runController(getAllUsers, req, res);
      if (segments.length === 1 && req.method === 'POST') return runController(createUser, req, res);
      if (segments.length === 2 && req.method === 'PATCH') return runController(updateUser, req, res);
      if (segments.length === 2 && req.method === 'DELETE') return runController(deleteUser, req, res);

      return sendJson(res, 405, { error: 'Method Not Allowed' });
    }

    if (resource === 'products') {
      req.params = req.params || {};
      req.params.productId = idOrAction;

      if (segments.length === 1 && req.method === 'GET') {
        return runController(getAllProducts, req, res);
      }

      await attachUser(req);

      if (segments.length === 1 && req.method === 'POST') {
        requireRole(req, allowedRoleMap.productsWrite);
        return runController(createProduct, req, res);
      }

      if (segments.length === 2 && idOrAction === 'buy' && req.method === 'POST') {
        requireRole(req, allowedRoleMap.productsBuy);
        return runController(buyProduct, req, res);
      }

      if (segments.length === 2 && req.method === 'DELETE') {
        requireRole(req, allowedRoleMap.productsWrite);
        return runController(deleteProduct, req, res);
      }

      return sendJson(res, 405, { error: 'Method Not Allowed' });
    }

    if (resource === 'orders') {
      await attachUser(req);
      req.params = req.params || {};
      req.params.orderId = idOrAction;

      if (segments.length === 1 && req.method === 'GET') {
        requireRole(req, allowedRoleMap.ordersRead);
        return runController(getMyOrders, req, res);
      }

      if (segments.length === 2 && idOrAction === 'checkout' && req.method === 'POST') {
        requireRole(req, allowedRoleMap.ordersWrite);
        return runController(checkoutOrder, req, res);
      }

      if (segments.length === 3 && nestedAction === 'cancel' && req.method === 'PATCH') {
        requireRole(req, allowedRoleMap.ordersCancel);
        return runController(cancelOrder, req, res);
      }

      return sendJson(res, 405, { error: 'Method Not Allowed' });
    }

    if (resource === 'farmers') {
      await attachUser(req);
      req.params = req.params || {};
      req.params.farmerId = idOrAction;

      if (segments.length === 1 && req.method === 'GET') {
        requireRole(req, allowedRoleMap.farmersRead);
        return runController(getAllFarmers, req, res);
      }

      if (segments.length === 1 && req.method === 'POST') {
        requireRole(req, allowedRoleMap.farmersWrite);
        return runController(createFarmerProfile, req, res);
      }

      if (segments.length === 2 && req.method === 'GET') {
        requireRole(req, allowedRoleMap.farmersRead);
        return runController(getFarmerProfile, req, res);
      }

      if (segments.length === 2 && req.method === 'PATCH') {
        requireRole(req, allowedRoleMap.farmersRead);
        return runController(updateFarmerProfile, req, res);
      }

      if (segments.length === 3 && idOrAction === 'batch' && nestedAction === 'update' && req.method === 'PATCH') {
        requireRole(req, allowedRoleMap.farmersAdmin);
        return runController(batchUpdateFarmers, req, res);
      }

      return sendJson(res, 405, { error: 'Method Not Allowed' });
    }

    return sendJson(res, 404, { error: 'Not Found' });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return sendJson(res, statusCode, { error: error.message });
  }
};