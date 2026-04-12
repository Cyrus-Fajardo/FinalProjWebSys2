const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const connectToDatabase = require('../config/db');
const User = require('../models/User');

class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      fullname: user.fullname,
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

const buildUserPayload = (user) => ({
  id: user._id,
  email: user.email,
  role: user.role,
  fullname: user.fullname,
});

const loginUser = async ({ email, password, role }) => {
  await connectToDatabase();

  if (!email || !password || !role) {
    throw new ApiError('Email, password, and role are required', 400);
  }

  const user = await User.findOne({ email: normalizeEmail(email) });

  if (!user || user.role !== role) {
    throw new ApiError('User not found', 404);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError('Incorrect password', 401);
  }

  const token = createToken(user);

  return {
    statusCode: 200,
    body: {
      message: 'Login successful',
      token,
      user: buildUserPayload(user),
    },
  };
};

const registerUser = async ({ fullname, email, password, role }) => {
  await connectToDatabase();

  if (!fullname || !email || !password || !role) {
    throw new ApiError('Full name, email, password, and role are required', 400);
  }

  if (!['Farmer', 'Buyer'].includes(role)) {
    throw new ApiError('Invalid role for registration', 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError('Email already exists', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    fullname,
    email: normalizedEmail,
    password: hashedPassword,
    role,
  });

  await newUser.save();

  const token = createToken(newUser);

  return {
    statusCode: 201,
    body: {
      message: 'Registration successful',
      token,
      user: buildUserPayload(newUser),
    },
  };
};

const sendControllerResponse = async (handler, req, res) => {
  try {
    const result = await handler(req.body);
    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message });
  }
};

const login = async (req, res) => sendControllerResponse(loginUser, req, res);

const register = async (req, res) => sendControllerResponse(registerUser, req, res);

module.exports = {
  login,
  register,
  loginUser,
  registerUser,
  ApiError,
};
