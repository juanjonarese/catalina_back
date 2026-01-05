const express = require("express");
const {
  CrearPreferenciaPago,
  WebhookMercadoPago,
  ObtenerEstadoPago,
} = require("../controllers/pagos.controllers");

const router = express.Router();

// Crear preferencia de pago
router.post("/crear-preferencia", CrearPreferenciaPago);

// Webhook de MercadoPago (recibe notificaciones de pagos)
router.post("/webhook", WebhookMercadoPago);

// Obtener estado de pago por ID de reserva
router.get("/reserva/:reservaId", ObtenerEstadoPago);

module.exports = router;
