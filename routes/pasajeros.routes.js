const express = require("express");
const {
  CrearPasajero,
  ObtenerPasajeros,
  ObtenerPasajeroPorId,
  ActualizarPasajero,
  EliminarPasajero,
} = require("../controllers/pasajeros.controllers");

const router = express.Router();

router.post("/", CrearPasajero);
router.get("/", ObtenerPasajeros);
router.get("/:id", ObtenerPasajeroPorId);
router.put("/:id", ActualizarPasajero);
router.delete("/:id", EliminarPasajero);

module.exports = router;
