const { Router } = require("express");
const { ObtenerUsuarios, CrearUsuario, ActualizarUsuario, EliminarUsuario } = require("../controllers/usuarios.controllers");
const { verifyToken, requireSuperadmin } = require("../middleware/authMiddleware");

const router = Router();

// Todas las rutas requieren token válido + rol superadmin
router.use(verifyToken, requireSuperadmin);

router.get("/", ObtenerUsuarios);
router.post("/", CrearUsuario);
router.put("/:id", ActualizarUsuario);
router.delete("/:id", EliminarUsuario);

module.exports = router;
