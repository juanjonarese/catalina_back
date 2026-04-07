const { Router } = require("express");
const { ObtenerCuentaHabitacion, RegistrarCobro, ObtenerCobrosPorTurno } = require("../controllers/cobros.controllers");

const router = Router();

router.get("/cuenta/habitacion/:habitacion", ObtenerCuentaHabitacion);
router.get("/turno/:turnoId", ObtenerCobrosPorTurno);
router.post("/", RegistrarCobro);

module.exports = router;
