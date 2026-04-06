const { Router } = require("express");
const { AbrirTurno, ObtenerTurnoActual, ObtenerTurnos, CerrarTurno, ResumenApertura, CambioTurno } = require("../controllers/turnos.controllers");

const router = Router();

router.get("/resumen-apertura", ResumenApertura);
router.get("/actual", ObtenerTurnoActual);
router.get("/", ObtenerTurnos);
router.post("/abrir", AbrirTurno);
router.post("/cambio", CambioTurno);
router.put("/:id/cerrar", CerrarTurno);

module.exports = router;
