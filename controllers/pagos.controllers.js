const {
  CrearPreferenciaService,
  ProcesarWebhookService,
  ConsultarPagoService,
} = require("../services/mercadopago.services");

/**
 * Crear preferencia de pago para una reserva
 */
const CrearPreferenciaPago = async (req, res) => {
  console.log("📦 Creando preferencia de pago");

  const datosReserva = req.body;

  const { error, msg, preferencia, statusCode, detalles } = await CrearPreferenciaService(
    datosReserva
  );

  if (error) {
    return res.status(statusCode).json({ error, msg, detalles });
  }

  res.status(statusCode).json({
    error: false,
    msg: "Preferencia creada exitosamente",
    preferenceId: preferencia.id,
    initPoint: preferencia.init_point,
  });
};

/**
 * Recibir notificaciones de Mercado Pago (webhook)
 */
const WebhookMercadoPago = async (req, res) => {
  // Mercado Pago envía los datos en el body y query
  const data = req.body || req.query;

  console.log("🔔 Webhook recibido de Mercado Pago");

  // Responder inmediatamente a Mercado Pago con 200
  // (para que no reintente enviar la notificación)
  res.status(200).send("OK");

  // Procesar el webhook de forma asíncrona
  const { error, msg, reserva } = await ProcesarWebhookService(data);

  if (error) {
    console.error("❌ Error procesando webhook:", msg);
  } else {
    console.log("✅ Webhook procesado exitosamente");
  }
};

/**
 * Consultar estado de un pago
 */
const ConsultarPago = async (req, res) => {
  const { paymentId } = req.params;

  const { error, msg, pago, statusCode } = await ConsultarPagoService(
    paymentId
  );

  if (error) {
    return res.status(statusCode).json({ error, msg });
  }

  res.status(statusCode).json({
    error: false,
    pago,
  });
};

/**
 * Obtener estado de un pago por ID de reserva
 */
const ObtenerEstadoPago = async (req, res) => {
  try {
    const PagosModel = require("../models/pagos.model");
    const { reservaId } = req.params;

    const pago = await PagosModel.findOne({ reservaId });

    if (!pago) {
      return res.status(404).json({ msg: "Pago no encontrado" });
    }

    res.status(200).json({ pago });
  } catch (error) {
    console.error("Error en ObtenerEstadoPago:", error);
    res.status(500).json({ msg: "Error al obtener el estado del pago" });
  }
};

module.exports = {
  CrearPreferenciaPago,
  WebhookMercadoPago,
  ConsultarPago,
  ObtenerEstadoPago,
};
