const express = require('express');
const {
  getFarmerProfile,
  getAllFarmers,
  updateFarmerProfile,
  createFarmerProfile,
  batchUpdateFarmers
} = require('../controllers/farmerController');
const { authMiddleware } = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');
const { requireMinimumTier } = roleMiddleware;

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
router.patch('/batch/update', authMiddleware, requireMinimumTier('manager'), batchUpdateFarmers);

module.exports = router;
