process.env.JWT_SECRET = 'test-jwt-secret';

jest.mock('../config/db', () => jest.fn(() => Promise.resolve()));
jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));
jest.mock('../models/RefreshToken', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  updateMany: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { refreshUserToken } = require('../controllers/authController');

const makeRefreshToken = (overrides = {}) => {
  return jwt.sign(
    {
      userId: '507f1f77bcf86cd799439011',
      tokenVersion: 0,
      type: 'refresh',
      family: 'family-1',
      jti: 'jti-1',
      ...overrides,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('refreshUserToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rotates refresh token for valid session', async () => {
    const refreshToken = makeRefreshToken();
    const tokenRecord = {
      revokedAt: null,
      family: 'family-1',
      save: jest.fn().mockResolvedValue(undefined),
    };

    RefreshToken.findOne.mockResolvedValue(tokenRecord);
    RefreshToken.create.mockResolvedValue({});
    User.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      email: 'farmer@example.com',
      role: 'Farmer',
      fullname: 'Farmer One',
      tokenVersion: 0,
    });

    const result = await refreshUserToken({ refreshToken }, { ip: '127.0.0.1', userAgent: 'jest' });

    expect(result.statusCode).toBe(200);
    expect(result.body.message).toBe('Token refreshed');
    expect(result.body.token).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.body.user.role).toBe('Farmer');
    expect(RefreshToken.create).toHaveBeenCalledTimes(1);
    expect(tokenRecord.revokedReason).toBe('Refresh token rotation');
    expect(tokenRecord.replacedByTokenHash).toBeTruthy();
    expect(tokenRecord.save).toHaveBeenCalledTimes(1);
  });

  test('rejects reused refresh token and revokes token family', async () => {
    const refreshToken = makeRefreshToken();

    RefreshToken.findOne.mockResolvedValue({
      revokedAt: new Date(),
      family: 'family-1',
      save: jest.fn(),
    });

    await expect(refreshUserToken({ refreshToken }, {})).rejects.toMatchObject({
      message: 'Invalid token',
      statusCode: 401,
    });

    expect(RefreshToken.updateMany).toHaveBeenCalledWith(
      { family: 'family-1', revokedAt: null },
      {
        $set: expect.objectContaining({ revokedReason: 'Refresh token reuse detected' }),
      }
    );
  });
});
