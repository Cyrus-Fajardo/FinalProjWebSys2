const DEFAULT_ALLOWED_ROLES = ['Kaluppa Foundation', 'DTI'];

const ROLE_TIERS = {
  admin: ['Kaluppa Foundation', 'DTI'],
  manager: ['Group Manager'],
  user: ['Farmer', 'Buyer'],
};

const TIER_RANK = {
  user: 1,
  manager: 2,
  admin: 3,
};

const getRoleTier = (role) => {
  if (ROLE_TIERS.admin.includes(role)) return 'admin';
  if (ROLE_TIERS.manager.includes(role)) return 'manager';
  if (ROLE_TIERS.user.includes(role)) return 'user';
  return null;
};

const hasMinimumTier = (role, minimumTier) => {
  const currentTier = getRoleTier(role);

  if (!currentTier || !TIER_RANK[minimumTier]) {
    return false;
  }

  return TIER_RANK[currentTier] >= TIER_RANK[minimumTier];
};

const roleMiddleware = (allowedRoles = DEFAULT_ALLOWED_ROLES) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return next();
  };
};

const requireMinimumTier = (minimumTier) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!hasMinimumTier(req.user.role, minimumTier)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return next();
  };
};

module.exports = roleMiddleware;
module.exports.roleMiddleware = roleMiddleware;
module.exports.requireMinimumTier = requireMinimumTier;
module.exports.ROLE_TIERS = ROLE_TIERS;
module.exports.getRoleTier = getRoleTier;
