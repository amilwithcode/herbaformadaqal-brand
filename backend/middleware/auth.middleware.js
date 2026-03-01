const jwt = require("jsonwebtoken");
const config = require("../config/env.config");

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Token tələb olunur" });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ message: "Token etibarlı deyil" });
  }
};

module.exports = authMiddleware;

