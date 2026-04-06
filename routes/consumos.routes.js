const { Router } = require("express");
const { CrearConsumo, ObtenerConsumosPorPasajero, EliminarConsumo } = require("../controllers/consumos.controllers");

const router = Router();

router.post("/", CrearConsumo);
router.get("/pasajero/:pasajeroId", ObtenerConsumosPorPasajero);
router.delete("/:id", EliminarConsumo);

module.exports = router;
