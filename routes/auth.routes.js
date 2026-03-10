const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// POST /auth/login
// Compara contra las variables de entorno ADMIN_EMAIL y ADMIN_PASSWORD_HASH
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "Email y contraseña requeridos" });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminEmail || !adminPasswordHash) {
      return res.status(500).json({ msg: "Credenciales de administrador no configuradas" });
    }

    if (email.toLowerCase() !== adminEmail.toLowerCase()) {
      return res.status(401).json({ msg: "Credenciales incorrectas" });
    }

    const passwordOk = await bcrypt.compare(password, adminPasswordHash);
    if (!passwordOk) {
      return res.status(401).json({ msg: "Credenciales incorrectas" });
    }

    const token = jwt.sign(
      { email: adminEmail, role: "admin" },
      process.env.JWT_SECRET || "hotel_secret_key",
      { expiresIn: "8h" }
    );

    res.json({ token, email: adminEmail });
  } catch (error) {
    res.status(500).json({ msg: "Error al procesar el login", error: error.message });
  }
});

module.exports = router;
