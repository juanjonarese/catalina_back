const express = require("express");
const {
  CrearReserva,
  ObtenerReservas,
  ObtenerReservaPorId,
  ActualizarEstadoReserva,
  CancelarReserva,
} = require("../controllers/reservas.controllers");

const router = express.Router();

router.post("/", CrearReserva);
router.get("/", ObtenerReservas);
router.get("/:id", ObtenerReservaPorId);
router.put("/:id/estado", ActualizarEstadoReserva);
router.put("/:id/cancelar", CancelarReserva);

module.exports = router;
