const User = require('../models/User');
const bcrypt = require('bcryptjs');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.body.fullname !== undefined) {
      user.fullname = req.body.fullname;
    }

    if (req.body.email !== undefined) {
      user.email = String(req.body.email).toLowerCase();
    }

    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    await user.save();

    return res.status(200).json({
      message: 'Account info updated successfully',
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        verificationCertificateUrl: user.verificationCertificateUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const submitVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!['Buyer', 'Farmer'].includes(user.role)) {
      return res.status(400).json({ error: 'Verification submission is only required for Buyer and Farmer roles' });
    }

    const certificateUrl = String(req.body.certificateUrl || '').trim();

    if (!certificateUrl) {
      return res.status(400).json({ error: 'Certificate URL is required' });
    }

    user.verificationCertificateUrl = certificateUrl;
    user.verificationSubmittedAt = new Date();
    user.isVerified = true;
    await user.save();

    return res.status(200).json({
      message: 'Verification submitted successfully',
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        verificationCertificateUrl: user.verificationCertificateUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { fullname, email, password, role } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullname,
      email: email.toLowerCase(),
      password: hashedPassword,
      role
    });

    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullname, email, role } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { fullname, email: email?.toLowerCase(), role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getMyProfile,
  updateMyProfile,
  submitVerification,
};
