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
  const data = req.body || req.query;

  // Procesar primero, responder después
  // En Vercel serverless la función se corta al enviar la respuesta
  const { error, msg } = await ProcesarWebhookService(data);

  if (error) {
    console.error("❌ Error procesando webhook:", msg);
  }

  res.status(200).send("OK");
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
