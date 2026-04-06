const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const UsuariosModel = require("../models/usuarios.model");

// Crea el superadmin inicial desde env vars si no existe ningún usuario en la DB
const seedSuperadminSiNoExiste = async () => {
  try {
    const count = await UsuariosModel.countDocuments();
    if (count > 0) return;

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const adminNombre = process.env.ADMIN_NOMBRE || "Superadmin";

    if (!adminEmail || !adminPasswordHash) return;

    await UsuariosModel.create({
      nombre: adminNombre,
      email: adminEmail.toLowerCase(),
      passwordHash: adminPasswordHash,
      rol: "superadmin",
      activo: true,
    });

    console.log("✓ Superadmin inicial creado desde env vars:", adminEmail);
  } catch (error) {
    console.error("Error al crear superadmin inicial:", error.message);
  }
};

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "Email y contraseña requeridos" });
    }

    // Crear superadmin desde env vars si la colección está vacía
    await seedSuperadminSiNoExiste();

    // Buscar usuario en la DB
    const usuario = await UsuariosModel.findOne({ email: email.toLowerCase() });

    if (!usuario) {
      return res.status(401).json({ msg: "Credenciales incorrectas" });
    }

    if (!usuario.activo) {
      return res.status(403).json({ msg: "Usuario desactivado. Contactá al administrador." });
    }

    const passwordOk = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ msg: "Credenciales incorrectas" });
    }

    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
      process.env.JWT_SECRET || "hotel_secret_key",
      { expiresIn: "8h" }
    );

    res.json({
      token,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al procesar el login", error: error.message });
  }
});

module.exports = router;
