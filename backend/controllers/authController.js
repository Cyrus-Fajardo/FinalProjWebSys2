const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const connectToDatabase = require('../config/db');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

const ACCESS_TOKEN_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_NAME = 'refreshToken';

class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const parseCookies = (cookieHeader = '') => {
  return cookieHeader
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const separatorIndex = item.indexOf('=');

      if (separatorIndex === -1) {
        return acc;
      }

      const key = item.slice(0, separatorIndex);
      const value = decodeURIComponent(item.slice(separatorIndex + 1));
      acc[key] = value;
      return acc;
    }, {});
};

const getRefreshTokenFromRequest = (req) => {
  const cookieHeader = req.headers?.cookie || req.headers?.Cookie || '';
  const cookies = parseCookies(cookieHeader);

  if (cookies[REFRESH_COOKIE_NAME]) {
    return cookies[REFRESH_COOKIE_NAME];
  }

  return req.body?.refreshToken || null;
};

const getRequestMetadata = (req) => {
  const forwardedFor = req.headers?.['x-forwarded-for'];
  const ip = forwardedFor ? String(forwardedFor).split(',')[0].trim() : req.ip || req.socket?.remoteAddress || null;

  return {
    ip,
    userAgent: req.headers?.['user-agent'] || null,
  };
};

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/api',
  maxAge: REFRESH_TOKEN_MAX_AGE_MS,
});

const attachRefreshCookie = (res, refreshToken) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...getRefreshCookieOptions(),
    maxAge: undefined,
  });
};

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new ApiError('JWT secret is not configured', 500);
  }

  return process.env.JWT_SECRET;
};

const createAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      fullname: user.fullname,
      tokenVersion: user.tokenVersion || 0,
    },
    getJwtSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
};

const createRefreshToken = (user, family) => {
  return jwt.sign(
    {
      userId: user._id,
      tokenVersion: user.tokenVersion || 0,
      type: 'refresh',
      family,
      jti: crypto.randomUUID(),
    },
    getJwtSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
};

const persistRefreshToken = async ({ token, userId, family, metadata }) => {
  const decoded = jwt.decode(token);

  await RefreshToken.create({
    userId,
    tokenHash: hashToken(token),
    family,
    createdByIp: metadata?.ip || null,
    userAgent: metadata?.userAgent || null,
    expiresAt: new Date(decoded.exp * 1000),
  });
};

const revokeTokenFamily = async (family, reason) => {
  await RefreshToken.updateMany(
    { family, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } }
  );
};

const issueTokenPair = async (user, metadata, family = crypto.randomUUID()) => {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user, family);

  await persistRefreshToken({
    token: refreshToken,
    userId: user._id,
    family,
    metadata,
  });

  return {
    accessToken,
    refreshToken,
    family,
  };
};

const buildUserPayload = (user) => ({
  userId: user._id,
  email: user.email,
  role: user.role,
  fullname: user.fullname,
  isVerified: user.isVerified,
  verificationCertificateUrl: user.verificationCertificateUrl || '',
});

const loginUser = async ({ email, password }, metadata = {}) => {
  await connectToDatabase();

  if (!email || !password) {
    throw new ApiError('Email and password are required', 400);
  }

  const user = await User.findOne({ email: normalizeEmail(email) });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError('Incorrect password', 401);
  }

  const { accessToken, refreshToken } = await issueTokenPair(user, metadata);

  return {
    statusCode: 200,
    body: {
      message: 'Login successful',
      token: accessToken,
      user: buildUserPayload(user),
    },
    refreshToken,
  };
};

const registerUser = async ({ fullname, email, password, role }, metadata = {}) => {
  await connectToDatabase();

  if (!fullname || !email || !password || !role) {
    throw new ApiError('Full name, email, password, and role are required', 400);
  }

  if (!['Farmer', 'Buyer'].includes(role)) {
    throw new ApiError('Registration is only allowed for Farmer and Buyer roles', 400);
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

  const { accessToken, refreshToken } = await issueTokenPair(newUser, metadata);

  return {
    statusCode: 201,
    body: {
      message: 'Registration successful',
      token: accessToken,
      user: buildUserPayload(newUser),
    },
    refreshToken,
  };
};

const refreshUserToken = async ({ refreshToken }, metadata = {}) => {
  await connectToDatabase();

  if (!refreshToken) {
    throw new ApiError('Refresh token is required', 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, getJwtSecret());
  } catch (error) {
    throw new ApiError('Invalid token', 401);
  }

  if (decoded.type !== 'refresh') {
    throw new ApiError('Invalid token', 401);
  }

  const tokenHash = hashToken(refreshToken);
  const tokenRecord = await RefreshToken.findOne({ tokenHash });

  if (!tokenRecord) {
    throw new ApiError('Invalid token', 401);
  }

  if (tokenRecord.revokedAt) {
    await revokeTokenFamily(tokenRecord.family, 'Refresh token reuse detected');
    throw new ApiError('Invalid token', 401);
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new ApiError('Invalid token', 401);
  }

  if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
    await revokeTokenFamily(tokenRecord.family, 'Token version mismatch');
    throw new ApiError('Token no longer valid', 401);
  }

  const { accessToken, refreshToken: nextRefreshToken } = await issueTokenPair(user, metadata, tokenRecord.family);

  tokenRecord.revokedAt = new Date();
  tokenRecord.revokedReason = 'Refresh token rotation';
  tokenRecord.replacedByTokenHash = hashToken(nextRefreshToken);
  await tokenRecord.save();

  return {
    statusCode: 200,
    body: {
      message: 'Token refreshed',
      token: accessToken,
      user: buildUserPayload(user),
    },
    refreshToken: nextRefreshToken,
  };
};

const logoutUser = async ({ refreshToken, userId }) => {
  await connectToDatabase();

  if (refreshToken) {
    const tokenRecord = await RefreshToken.findOne({ tokenHash: hashToken(refreshToken) });

    if (tokenRecord && !tokenRecord.revokedAt && (!userId || String(tokenRecord.userId) === String(userId))) {
      tokenRecord.revokedAt = new Date();
      tokenRecord.revokedReason = 'User logout';
      await tokenRecord.save();
    }
  }

  return {
    statusCode: 200,
    body: { message: 'Logout successful' },
  };
};

const logoutAllUserSessions = async ({ userId }) => {
  await connectToDatabase();

  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: 'Logout all sessions' } }
  );

  return {
    statusCode: 200,
    body: { message: 'Logged out from all sessions' },
  };
};

const changeUserPassword = async ({ userId, currentPassword, newPassword }, metadata = {}) => {
  await connectToDatabase();

  if (!currentPassword || !newPassword) {
    throw new ApiError('Current password and new password are required', 400);
  }

  if (newPassword.length < 6) {
    throw new ApiError('New password must be at least 6 characters', 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new ApiError('Current password is incorrect', 401);
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  user.passwordChangedAt = new Date();
  await user.save();

  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: 'Password changed' } }
  );

  const { accessToken, refreshToken } = await issueTokenPair(user, metadata);

  return {
    statusCode: 200,
    body: {
      message: 'Password updated successfully',
      token: accessToken,
      user: buildUserPayload(user),
    },
    refreshToken,
  };
};

const sendControllerResponse = async (handler, req, res, options = {}) => {
  try {
    const result = await handler(req.body, getRequestMetadata(req));

    if (options.withRefreshCookie && result.refreshToken) {
      attachRefreshCookie(res, result.refreshToken);
    }

    if (options.clearRefreshCookie) {
      clearRefreshCookie(res);
    }

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message });
  }
};

const login = async (req, res) => sendControllerResponse(loginUser, req, res, { withRefreshCookie: true });

const register = async (req, res) => sendControllerResponse(registerUser, req, res, { withRefreshCookie: true });

const refresh = async (req, res) => {
  req.body = req.body || {};
  req.body.refreshToken = req.body.refreshToken || getRefreshTokenFromRequest(req);
  return sendControllerResponse(refreshUserToken, req, res, { withRefreshCookie: true });
};

const logout = async (req, res) => {
  req.body = {
    refreshToken: getRefreshTokenFromRequest(req),
    userId: req.user?.userId,
  };

  return sendControllerResponse(logoutUser, req, res, { clearRefreshCookie: true });
};

const logoutAll = async (req, res) => {
  req.body = { userId: req.user?.userId };
  return sendControllerResponse(logoutAllUserSessions, req, res, { clearRefreshCookie: true });
};

const changePassword = async (req, res) => {
  req.body = {
    ...req.body,
    userId: req.user?.userId,
  };

  return sendControllerResponse(changeUserPassword, req, res, { withRefreshCookie: true });
};

module.exports = {
  login,
  register,
  refresh,
  logout,
  logoutAll,
  changePassword,
  loginUser,
  registerUser,
  refreshUserToken,
  logoutUser,
  logoutAllUserSessions,
  changeUserPassword,
  getRefreshTokenFromRequest,
  ApiError,
};
