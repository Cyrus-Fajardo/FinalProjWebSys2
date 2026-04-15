const Seller = require('../models/Seller');
const User = require('../models/User');

const ADMIN_ROLES = ['Kaluppa Foundation', 'DTI'];

const isAdmin = (role) => ADMIN_ROLES.includes(role);

const isGroupManager = (role) => role === 'Group Manager';

const ensureProfileAccess = async (profile, reqUser, { allowManagerOnlyFarmers = false } = {}) => {
  if (isAdmin(reqUser.role)) {
    return null;
  }

  if (reqUser.role === 'Farmer' && String(profile.userId?._id || profile.userId) === String(reqUser.userId)) {
    return null;
  }

  if (isGroupManager(reqUser.role)) {
    const assigned = String(profile.assignedManager?._id || profile.assignedManager || '') === String(reqUser.userId);
    const profileRole = profile.userId?.role || null;

    if (assigned && (!allowManagerOnlyFarmers || profileRole === 'Farmer')) {
      return null;
    }
  }

  return 'Access denied';
};

const getFarmerProfile = async (req, res) => {
  try {
    const { farmerId } = req.params;

    const seller = await Seller.findById(farmerId)
      .populate('userId', 'fullname email role isVerified')
      .populate('assignedManager', 'fullname email role');

    if (!seller) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }

    const accessError = await ensureProfileAccess(seller, req.user, { allowManagerOnlyFarmers: true });
    if (accessError) {
      return res.status(403).json({ error: accessError });
    }

    return res.status(200).json(seller);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getAllFarmers = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === 'Farmer') {
      query.userId = req.user.userId;
    }

    if (isGroupManager(req.user.role)) {
      query.assignedManager = req.user.userId;
    }

    let sellers = await Seller.find(query)
      .populate('userId', 'fullname email role isVerified')
      .populate('assignedManager', 'fullname email role');

    if (isGroupManager(req.user.role)) {
      sellers = sellers.filter((profile) => profile.userId?.role === 'Farmer');
    }

    return res.status(200).json(sellers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const normalizeUpdatePayload = (payload) => {
  const updateData = {};
  const allowedFields = [
    'sellerName',
    'farmName',
    'farmSize',
    'farmSizeUnit',
    'location',
    'harvestDetails',
    'processDetails',
    'inventoryDetails',
  ];

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      updateData[field] = payload[field];
    }
  }

  return updateData;
};

const updateFarmerProfile = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const seller = await Seller.findById(farmerId).populate('userId', 'fullname email role');

    if (!seller) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }

    const accessError = await ensureProfileAccess(seller, req.user, { allowManagerOnlyFarmers: true });
    if (accessError) {
      return res.status(403).json({ error: accessError });
    }

    const updateData = normalizeUpdatePayload(req.body);

    if (req.body.assignedManager !== undefined) {
      if (!isAdmin(req.user.role)) {
        return res.status(403).json({ error: 'Only Kaluppa Foundation and DTI can assign managers' });
      }

      if (req.body.assignedManager) {
        const manager = await User.findById(req.body.assignedManager);
        if (!manager || manager.role !== 'Group Manager') {
          return res.status(400).json({ error: 'Assigned manager must be a valid Group Manager account' });
        }
      }

      updateData.assignedManager = req.body.assignedManager || null;
    }

    const updated = await Seller.findByIdAndUpdate(
      farmerId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    )
      .populate('userId', 'fullname email role isVerified')
      .populate('assignedManager', 'fullname email role');

    return res.status(200).json({
      message: 'Seller profile updated successfully',
      farmer: updated,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const createFarmerProfile = async (req, res) => {
  try {
    const targetUserId = req.body.userId || req.user.userId;

    if (req.user.role === 'Farmer' && String(targetUserId) !== String(req.user.userId)) {
      return res.status(403).json({ error: 'Farmers can only create their own profile' });
    }

    const owner = await User.findById(targetUserId);

    if (!owner) {
      return res.status(404).json({ error: 'Profile owner was not found' });
    }

    if (!['Farmer', 'Kaluppa Foundation'].includes(owner.role)) {
      return res.status(400).json({ error: 'Only Farmer and Kaluppa Foundation users can have seller profiles' });
    }

    const existingProfile = await Seller.findOne({ userId: targetUserId });
    if (existingProfile) {
      return res.status(400).json({ error: 'Seller profile already exists' });
    }

    const seller = new Seller({
      userId: targetUserId,
      sellerName: req.body.sellerName || owner.fullname,
      farmName: req.body.farmName || '',
      farmSize: req.body.farmSize || 0,
      farmSizeUnit: req.body.farmSizeUnit || 'hectares',
      location: req.body.location || '',
      harvestDetails: req.body.harvestDetails || {},
      processDetails: req.body.processDetails || {},
      inventoryDetails: req.body.inventoryDetails || {},
      assignedManager: isAdmin(req.user.role) ? (req.body.assignedManager || null) : null,
    });

    await seller.save();

    const hydrated = await Seller.findById(seller._id)
      .populate('userId', 'fullname email role isVerified')
      .populate('assignedManager', 'fullname email role');

    return res.status(201).json({
      message: 'Seller profile created successfully',
      farmer: hydrated,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const batchUpdateFarmers = async (req, res) => {
  try {
    const updates = Array.isArray(req.body.updates) ? req.body.updates : [];

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    const results = [];

    for (const entry of updates) {
      const { farmerId, updates: payload } = entry;
      const seller = await Seller.findById(farmerId).populate('userId', 'role');

      if (!seller) {
        continue;
      }

      const accessError = await ensureProfileAccess(seller, req.user, { allowManagerOnlyFarmers: true });
      if (accessError) {
        continue;
      }

      const updateData = normalizeUpdatePayload(payload || {});

      if ((payload || {}).assignedManager !== undefined && isAdmin(req.user.role)) {
        updateData.assignedManager = payload.assignedManager || null;
      }

      const updated = await Seller.findByIdAndUpdate(
        farmerId,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      )
        .populate('userId', 'fullname email role isVerified')
        .populate('assignedManager', 'fullname email role');

      results.push(updated);
    }

    return res.status(200).json({
      message: 'Farmer profiles updated successfully',
      farmers: results,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getFarmerProfile,
  getAllFarmers,
  updateFarmerProfile,
  createFarmerProfile,
  batchUpdateFarmers,
};
