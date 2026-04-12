const express = require('express');
const { getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');
const { requireMinimumTier } = roleMiddleware;

const router = express.Router();

// Only Kaluppa Foundation and DTI can access user management
router.get('/', authMiddleware, requireMinimumTier('admin'), getAllUsers);
// router.get('/', getAllUsers);
router.post('/', authMiddleware, requireMinimumTier('admin'), createUser);
router.patch('/:userId', authMiddleware, requireMinimumTier('admin'), updateUser);
router.delete('/:userId', authMiddleware, requireMinimumTier('admin'), deleteUser);

module.exports = router;
