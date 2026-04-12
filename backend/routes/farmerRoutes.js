const express = require('express');
const {
  getFarmerProfile,
  getAllFarmers,
  updateFarmerProfile,
  createFarmerProfile,
  batchUpdateFarmers
} = require('../controllers/farmerController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all farmers - accessible to Kaluppa Foundation, DTI, Group Managers, and Farmers
router.get('/', authMiddleware, roleMiddleware(['Kaluppa Foundation', 'DTI', 'Group Manager', 'Farmer']), getAllFarmers);

// Get single farmer profile
router.get('/:farmerId', authMiddleware, roleMiddleware(['Kaluppa Foundation', 'DTI', 'Group Manager', 'Farmer']), getFarmerProfile);

// Create farmer profile
router.post('/', authMiddleware, roleMiddleware(['Kaluppa Foundation', 'DTI', 'Farmer']), createFarmerProfile);

// Update farmer profile
router.patch('/:farmerId', authMiddleware, roleMiddleware(['Kaluppa Foundation', 'DTI', 'Group Manager', 'Farmer']), updateFarmerProfile);

// Batch update farmers - only for Group Managers
router.patch('/batch/update', authMiddleware, roleMiddleware(['Kaluppa Foundation', 'DTI', 'Group Manager']), batchUpdateFarmers);

module.exports = router;
