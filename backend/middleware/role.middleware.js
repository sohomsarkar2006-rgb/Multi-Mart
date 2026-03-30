function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      const error = new Error("You do not have permission for this action");
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
}

module.exports = {
  requireRole
};
