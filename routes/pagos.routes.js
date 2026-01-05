const express = require("express");
const {
  CrearPreferenciaPago,
  WebhookMercadoPago,
  ConsultarPago,
  ObtenerEstadoPago,
} = require("../controllers/pagos.controllers");

const router = express.Router();

// Crear preferencia de pago (NO requiere autenticación)
router.post("/crear-preferencia", CrearPreferenciaPago);

// Webhook de Mercado Pago (NO requiere autenticación, Mercado Pago lo llama)
router.post("/webhook", WebhookMercadoPago);

// Consultar estado de un pago por payment ID
router.get("/pago/:paymentId", ConsultarPago);

// Obtener estado de pago por ID de reserva
router.get("/reserva/:reservaId", ObtenerEstadoPago);

module.exports = router;
