const { Router } = require("express");
const { CrearConsumo, ObtenerConsumosPorHabitacion, EliminarConsumo } = require("../controllers/consumos.controllers");

const router = Router();

router.post("/", CrearConsumo);
router.get("/habitacion/:habitacion", ObtenerConsumosPorHabitacion);
router.delete("/:id", EliminarConsumo);

module.exports = router;
