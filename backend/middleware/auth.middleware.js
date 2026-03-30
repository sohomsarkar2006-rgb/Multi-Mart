const jwt = require("jsonwebtoken");

function requireAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      const error = new Error("Authentication token missing");
      error.statusCode = 401;
      throw error;
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "change_this_secret");
    req.user = payload;
    next();
  } catch (error) {
    error.statusCode = 401;
    next(error);
  }
}

module.exports = {
  requireAuth
};
