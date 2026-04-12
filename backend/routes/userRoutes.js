const express = require('express');
const { getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Only Kaluppa Foundation and DTI can access user management
// router.get('/', authMiddleware, roleMiddleware(['Kaluppa Foundation', 'DTI']), getAllUsers);
router.get('/', getAllUsers);
router.post('/', authMiddleware, roleMiddleware(['Kaluppa Foundation', 'DTI']), createUser);
router.patch('/:userId', authMiddleware, roleMiddleware(['Kaluppa Foundation', 'DTI']), updateUser);
router.delete('/:userId', authMiddleware, roleMiddleware(['Kaluppa Foundation', 'DTI']), deleteUser);

module.exports = router;
