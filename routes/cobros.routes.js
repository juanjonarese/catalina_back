const { Router } = require("express");
const { ObtenerCuentaPasajero, RegistrarCobro, ObtenerCobrosPorTurno } = require("../controllers/cobros.controllers");

const router = Router();

router.get("/cuenta/:pasajeroId", ObtenerCuentaPasajero);
router.get("/turno/:turnoId", ObtenerCobrosPorTurno);
router.post("/", RegistrarCobro);

module.exports = router;
