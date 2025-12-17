const express = require("express");
const {
  ObtenerHabitaciones,
  ObtenerHabitacionPorId,
  VerificarDisponibilidad,
  CrearHabitacion,
  ActualizarHabitacion,
  EliminarHabitacion,
} = require("../controllers/habitaciones.controllers");

const router = express.Router();

router.get("/", ObtenerHabitaciones);
router.get("/disponibilidad", VerificarDisponibilidad);
router.get("/:id", ObtenerHabitacionPorId);
router.post("/", CrearHabitacion);
router.put("/:id", ActualizarHabitacion);
router.delete("/:id", EliminarHabitacion);

module.exports = router;
