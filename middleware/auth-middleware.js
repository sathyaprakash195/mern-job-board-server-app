const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // take token from cookies
    console.log("Cookies:", req.cookies.token);
    const token = req.cookies.token;
    if (!token) {
      throw new Error("No token provided");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized access" });
  }
};

module.exports = authMiddleware;
