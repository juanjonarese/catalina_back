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
  console.log("\n🔔 ========== WEBHOOK RECIBIDO ==========");
  console.log("📅 Fecha:", new Date().toISOString());
  console.log("📋 Headers relevantes:", {
    "content-type": req.headers["content-type"],
    "x-signature": req.headers["x-signature"] || "no presente",
    "x-request-id": req.headers["x-request-id"] || "no presente",
  });
  console.log("📦 Body:", JSON.stringify(req.body, null, 2));
  console.log("🔗 Query params:", JSON.stringify(req.query, null, 2));

  const data = req.body || req.query;

  console.log("📌 Tipo de notificación:", data.type || "sin tipo");
  console.log("📌 ID del recurso:", data.data?.id || "sin id");

  const { error, msg, reserva } = await ProcesarWebhookService(data);

  if (error) {
    console.error("❌ Error procesando webhook:", msg);
  } else {
    console.log("✅ Webhook procesado OK:", msg);
    if (reserva) {
      console.log("🏨 Reserva creada:", reserva.codigoReserva, "- Estado:", reserva.estado);
    }
  }

  console.log("========================================\n");
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
