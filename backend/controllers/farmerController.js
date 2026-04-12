const Farmer = require('../models/Farmer');

const getFarmerProfile = async (req, res) => {
  try {
    const { farmerId } = req.params;

    const farmer = await Farmer.findById(farmerId).populate('userId', 'fullname email');

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer profile not found' });
    }

    res.status(200).json(farmer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllFarmers = async (req, res) => {
  try {
    const farmers = await Farmer.find().populate('userId', 'fullname email');
    res.status(200).json(farmers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateFarmerProfile = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { farmerName, farmName, farmSize, farmSizeUnit, varietiesAvailable, location } = req.body;

    const farmer = await Farmer.findByIdAndUpdate(
      farmerId,
      {
        farmerName,
        farmName,
        farmSize,
        farmSizeUnit,
        varietiesAvailable,
        location,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'fullname email');

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer profile not found' });
    }

    res.status(200).json({
      message: 'Farmer profile updated successfully',
      farmer
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createFarmerProfile = async (req, res) => {
  try {
    const { userId, farmerName, farmName, farmSize, farmSizeUnit, varietiesAvailable, location } = req.body;

    // Check if profile already exists
    const existingFarmer = await Farmer.findOne({ userId });
    if (existingFarmer) {
      return res.status(400).json({ error: 'Farmer profile already exists' });
    }

    const newFarmer = new Farmer({
      userId,
      farmerName,
      farmName,
      farmSize,
      farmSizeUnit,
      varietiesAvailable,
      location
    });

    await newFarmer.save();

    res.status(201).json({
      message: 'Farmer profile created successfully',
      farmer: newFarmer
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const batchUpdateFarmers = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { farmerId, updates }

    const results = [];

    for (const { farmerId, updates: updateData } of updates) {
      const farmer = await Farmer.findByIdAndUpdate(
        farmerId,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      ).populate('userId', 'fullname email');

      results.push(farmer);
    }

    res.status(200).json({
      message: 'Farmers updated successfully',
      farmers: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getFarmerProfile, getAllFarmers, updateFarmerProfile, createFarmerProfile, batchUpdateFarmers };
