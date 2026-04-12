const { registerUser, ApiError } = require('../controllers/authController');
const { handleOptions, sendJson } = require('../utils/http');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    const result = await registerUser(req.body || {});
    return sendJson(res, result.statusCode, result.body);
  } catch (error) {
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return sendJson(res, statusCode, { error: error.message });
  }
};