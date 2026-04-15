const User = require('../models/User');
const bcrypt = require('bcryptjs');

const ADMIN_ROLES = ['Kaluppa Foundation', 'DTI'];

const normalizeRoleInput = (role) => {
  if (role === 'Kaluppâ Foundation') {
    return 'Kaluppa Foundation';
  }

  return role;
};

const isAdminRole = (role) => ADMIN_ROLES.includes(normalizeRoleInput(role));

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
    const { fullname, email, password } = req.body;
    const role = normalizeRoleInput(req.body.role);

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
        _id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
        role: newUser.role,
        isVerified: newUser.isVerified,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const actorId = req.user?.userId;
    const actor = await User.findById(actorId).select('role');
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const incomingRole = req.body.role !== undefined ? normalizeRoleInput(req.body.role) : undefined;

    if (incomingRole !== undefined && isAdminRole(user.role) && incomingRole !== user.role) {
      return res.status(403).json({ error: 'DTI and Kaluppa Foundation roles cannot be changed' });
    }

    if (req.body.fullname !== undefined) {
      user.fullname = req.body.fullname;
    }

    if (req.body.email !== undefined) {
      const normalizedEmail = String(req.body.email || '').toLowerCase();
      const existingEmailUser = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });

      if (existingEmailUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      user.email = normalizedEmail;
    }

    if (incomingRole !== undefined && !isAdminRole(user.role)) {
      user.role = incomingRole;
    }

    if (req.body.password !== undefined && String(req.body.password).trim() !== '') {
      const actorRole = normalizeRoleInput(actor?.role);
      const targetRole = normalizeRoleInput(user.role);
      const isCrossAdminPasswordChange = isAdminRole(actorRole)
        && isAdminRole(targetRole)
        && actorRole !== targetRole
        && String(actorId) !== String(user._id);

      if (isCrossAdminPasswordChange) {
        return res.status(403).json({ error: 'Admins cannot change the password of a co-admin account' });
      }

      user.password = await bcrypt.hash(req.body.password, 10);
      user.passwordChangedAt = new Date();
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    if (req.body.isVerified !== undefined) {
      if (!['Buyer', 'Farmer'].includes(user.role)) {
        return res.status(400).json({ error: 'Only Buyer and Farmer verification status can be changed' });
      }

      user.isVerified = !!req.body.isVerified;
    }

    await user.save();

    const safeUser = await User.findById(userId).select('-password');

    res.status(200).json({
      message: 'User updated successfully',
      user: safeUser
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (isAdminRole(user.role)) {
      const sameRoleCount = await User.countDocuments({ role: user.role });

      if (sameRoleCount <= 1) {
        return res.status(400).json({ error: `Cannot delete the last remaining ${user.role} account` });
      }
    }

    await User.findByIdAndDelete(userId);

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
