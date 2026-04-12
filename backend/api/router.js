const jwt = require('jsonwebtoken');

const connectToDatabase = require('../config/db');
const { sendJson, handleOptions } = require('../utils/http');
const { ApiError, loginUser, registerUser } = require('../controllers/authController');
const { getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { getAllProducts, createProduct, deleteProduct, buyProduct } = require('../controllers/productController');
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

const attachUser = (req) => {
  const token = getBearerToken(req);

  if (!token) {
    throw new ApiError('No token provided', 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  req.user = decoded;
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

  const segments = getPathSegments(req);

  try {
    await connectToDatabase();

    if (segments.length === 0) {
      return sendJson(res, 404, { error: 'Not Found' });
    }

    const [resource, idOrAction, nestedAction] = segments;

    if (resource === 'login') {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });
      const result = await loginUser(req.body || {});
      return sendJson(res, result.statusCode, result.body);
    }

    if (resource === 'register') {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });
      const result = await registerUser(req.body || {});
      return sendJson(res, result.statusCode, result.body);
    }

    attachUser(req);

    if (resource === 'users') {
      requireRole(req, allowedRoleMap.users);
      req.params = req.params || {};
      req.params.userId = idOrAction;

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
        requireRole(req, allowedRoleMap.productsRead);
        return runController(getAllProducts, req, res);
      }

      if (segments.length === 1 && req.method === 'POST') {
        requireRole(req, allowedRoleMap.productsWrite);
        return runController(createProduct, req, res);
      }

      if (segments.length === 2 && idOrAction === 'buy' && req.method === 'POST') {
        requireRole(req, allowedRoleMap.productsBuy);
        return runController(buyProduct, req, res);
      }

      if (segments.length === 2 && req.method === 'DELETE') {
        return runController(deleteProduct, req, res);
      }

      return sendJson(res, 405, { error: 'Method Not Allowed' });
    }

    if (resource === 'farmers') {
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