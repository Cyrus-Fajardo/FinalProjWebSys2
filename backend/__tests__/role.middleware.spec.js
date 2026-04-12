const roleMiddleware = require('../middleware/roleMiddleware');
const { requireMinimumTier, getRoleTier } = roleMiddleware;

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('roleMiddleware hierarchy', () => {
  test('maps roles to expected tiers', () => {
    expect(getRoleTier('Kaluppa Foundation')).toBe('admin');
    expect(getRoleTier('DTI')).toBe('admin');
    expect(getRoleTier('Group Manager')).toBe('manager');
    expect(getRoleTier('Farmer')).toBe('user');
    expect(getRoleTier('Buyer')).toBe('user');
  });

  test('requireMinimumTier(manager) allows admin and manager, rejects user', () => {
    const middleware = requireMinimumTier('manager');
    const next = jest.fn();

    const adminReq = { user: { role: 'DTI' } };
    middleware(adminReq, createRes(), next);
    expect(next).toHaveBeenCalledTimes(1);

    const managerReq = { user: { role: 'Group Manager' } };
    middleware(managerReq, createRes(), next);
    expect(next).toHaveBeenCalledTimes(2);

    const userReq = { user: { role: 'Farmer' } };
    const userRes = createRes();
    middleware(userReq, userRes, next);
    expect(userRes.status).toHaveBeenCalledWith(403);
    expect(userRes.json).toHaveBeenCalledWith({ error: 'Access denied' });
    expect(next).toHaveBeenCalledTimes(2);
  });

  test('default roleMiddleware allows only admin roles', () => {
    const middleware = roleMiddleware();
    const next = jest.fn();

    const allowedReq = { user: { role: 'Kaluppa Foundation' } };
    middleware(allowedReq, createRes(), next);
    expect(next).toHaveBeenCalledTimes(1);

    const deniedReq = { user: { role: 'Group Manager' } };
    const deniedRes = createRes();
    middleware(deniedReq, deniedRes, next);

    expect(deniedRes.status).toHaveBeenCalledWith(403);
    expect(deniedRes.json).toHaveBeenCalledWith({ error: 'Access denied' });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
