const express = require("express");
const {
  CrearReserva,
  ObtenerReservas,
  ObtenerReservaPorId,
  ActualizarEstadoReserva,
  CancelarReserva,
  EliminarReserva,
} = require("../controllers/reservas.controllers");

const router = express.Router();

router.post("/", CrearReserva);
router.get("/", ObtenerReservas);
router.get("/:id", ObtenerReservaPorId);
router.put("/:id/estado", ActualizarEstadoReserva);
router.put("/:id/cancelar", CancelarReserva);
router.delete("/:id", EliminarReserva);

module.exports = router;
