const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Token requerido" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "hotel_secret_key");
    req.usuario = decoded;
    next();
  } catch {
    return res.status(401).json({ msg: "Token inválido o expirado" });
  }
};

const requireSuperadmin = (req, res, next) => {
  if (req.usuario?.rol !== "superadmin") {
    return res.status(403).json({ msg: "Acceso restringido a superadmin" });
  }
  next();
};

module.exports = { verifyToken, requireSuperadmin };
