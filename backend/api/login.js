const { login } = require('../controllers/authController');
const { applyCorsHeaders, handleOptions, sendJson } = require('../utils/http');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  applyCorsHeaders(res);
  return login(req, res);
};