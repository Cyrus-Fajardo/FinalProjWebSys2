const express = require('express');
const { login, register, refresh, logout, logoutAll, changePassword } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refresh);
router.post('/logout', authMiddleware, logout);
router.post('/logout-all', authMiddleware, logoutAll);
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;
