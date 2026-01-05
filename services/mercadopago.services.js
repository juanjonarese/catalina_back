const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const PagosModel = require("../models/pagos.model");
const ReservasModel = require("../models/reservas.model");
const { confirmarReserva } = require("../helpers/mensajes.nodemailer.helper");

// Configurar Mercado Pago
console.log("🔑 MERCADOPAGO_ACCESS_TOKEN existe:", !!process.env.MERCADOPAGO_ACCESS_TOKEN);
console.log("🔑 Primeros caracteres:", process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 15));

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 5000,
  }
});

/**
 * Generar código único de reserva
 */
const generarCodigoReserva = async () => {
  const año = new Date().getFullYear();
  const mes = String(new Date().getMonth() + 1).padStart(2, "0");

  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let codigoAleatorio = "";
  for (let i = 0; i < 6; i++) {
    codigoAleatorio += caracteres.charAt(
      Math.floor(Math.random() * caracteres.length)
    );
  }

  const codigo = `RES-${año}${mes}-${codigoAleatorio}`;

  const existente = await ReservasModel.findOne({ codigoReserva: codigo });
  if (existente) {
    return generarCodigoReserva();
  }

  return codigo;
};

/**
 * Crear preferencia de pago para una reserva de hotel
 */
const CrearPreferenciaService = async (datosReserva) => {
  try {
    console.log("📦 Iniciando creación de preferencia para reserva");

    const {
      nombreCliente,
      emailCliente,
      telefonoCliente,
      habitacionId,
      numAdultos,
      numNinos,
      fechaCheckIn,
      fechaCheckOut,
      precioTotal,
      tituloHabitacion,
      numeroHabitacion,
    } = datosReserva;

    // Validar datos requeridos
    if (!emailCliente || !precioTotal || !nombreCliente || !habitacionId) {
      console.error("❌ Faltan datos requeridos");
      return {
        error: true,
        msg: "Faltan datos requeridos para crear la reserva",
        statusCode: 400,
      };
    }

    // Construir item para Mercado Pago
    const items = [
      {
        title: `Reserva Hotel - ${tituloHabitacion || "Habitación"} #${numeroHabitacion || ""}`,
        quantity: 1,
        unit_price: Number(precioTotal),
        currency_id: "ARS",
      },
    ];

    console.log("💰 Items para Mercado Pago:", items);

    // URLs de retorno
    const baseURL = process.env.FRONTEND_URL || "http://localhost:5173";

    // Generar ID temporal para esta preferencia
    const preferenciaId = `PREF-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Crear preferencia
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items,
        back_urls: {
          success: `${baseURL}/pago/success`,
          failure: `${baseURL}/pago/failure`,
          pending: `${baseURL}/pago/pending`,
        },
        auto_return: "approved",
        notification_url: `${process.env.BACKEND_URL}/pagos/webhook`,
        metadata: {
          nombre_cliente: nombreCliente,
          email_cliente: emailCliente,
          telefono_cliente: telefonoCliente || "",
          habitacion_id: habitacionId,
          num_adultos: numAdultos,
          num_ninos: numNinos,
          fecha_check_in: fechaCheckIn,
          fecha_check_out: fechaCheckOut,
          precio_total: precioTotal,
          preferencia_temp_id: preferenciaId,
        },
        statement_descriptor: "Hotel Reserva",
        external_reference: preferenciaId,
      },
    });

    console.log("✅ Preferencia creada:", result.id);

    // Guardar registro inicial del pago
    const nuevoPago = new PagosModel({
      mercadoPagoId: result.id,
      preferenciaId: result.id,
      monto: precioTotal,
      estado: "pending",
      emailPagador: emailCliente,
    });
    await nuevoPago.save();

    return {
      error: false,
      preferencia: {
        id: result.id,
        init_point: result.init_point, // IMPORTANTE: usar init_point con credenciales APP_USR
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("❌ Error al crear preferencia:", error);
    return {
      error: true,
      msg: "Error al crear preferencia de pago",
      detalles: error.message,
      statusCode: 500,
    };
  }
};

/**
 * Procesar notificación de webhook de Mercado Pago
 */
const ProcesarWebhookService = async (data) => {
  try {
    console.log("📨 Webhook recibido:", JSON.stringify(data, null, 2));

    // Mercado Pago envía notificaciones de tipo "payment"
    if (data.type !== "payment") {
      console.log("⚠️ Tipo de notificación ignorado:", data.type);
      return {
        error: false,
        msg: "Notificación ignorada",
        statusCode: 200,
      };
    }

    // Obtener información del pago
    const paymentId = data.data.id;
    const payment = new Payment(client);
    const paymentInfo = await payment.get({ id: paymentId });

    console.log("💰 Estado del pago:", paymentInfo.status);
    console.log("📋 Preference ID:", paymentInfo.preference_id);

    // Solo procesar si el pago fue aprobado
    if (paymentInfo.status !== "approved") {
      console.log("⏳ Pago no aprobado aún:", paymentInfo.status);
      return {
        error: false,
        msg: "Pago no aprobado",
        statusCode: 200,
      };
    }

    // Verificar si ya existe una reserva para este pago
    const pagoExistente = await PagosModel.findOne({
      preferenciaId: paymentInfo.preference_id,
    });

    if (pagoExistente && pagoExistente.reservaId) {
      console.log("⚠️ Reserva ya procesada anteriormente");
      return {
        error: false,
        msg: "Reserva ya procesada",
        statusCode: 200,
      };
    }

    // Obtener metadata
    const metadata = paymentInfo.metadata;

    if (!metadata || !metadata.habitacion_id) {
      console.error("❌ Metadata incompleta en el pago");
      return {
        error: true,
        msg: "Metadata incompleta",
        statusCode: 400,
      };
    }

    // Generar código único de reserva
    const codigoReserva = await generarCodigoReserva();

    // Crear la reserva
    const nuevaReserva = new ReservasModel({
      codigoReserva,
      nombreCliente: metadata.nombre_cliente,
      emailCliente: metadata.email_cliente,
      telefonoCliente: metadata.telefono_cliente || "",
      habitacionId: metadata.habitacion_id,
      numAdultos: metadata.num_adultos,
      numNinos: metadata.num_ninos,
      fechaCheckIn: metadata.fecha_check_in,
      fechaCheckOut: metadata.fecha_check_out,
      precioTotal: metadata.precio_total,
      estado: "confirmada", // Estado confirmada porque ya pagó
      pagoId: pagoExistente ? pagoExistente._id : null,
    });

    await nuevaReserva.save();
    await nuevaReserva.populate("habitacionId");

    // Actualizar el pago
    if (pagoExistente) {
      pagoExistente.mercadoPagoId = paymentId.toString();
      pagoExistente.reservaId = nuevaReserva._id;
      pagoExistente.estado = paymentInfo.status;
      pagoExistente.estadoDetalle = paymentInfo.status_detail;
      pagoExistente.metodoPago = paymentInfo.payment_method_id;
      pagoExistente.tipoPago = paymentInfo.payment_type_id;
      pagoExistente.datosMercadoPago = paymentInfo;
      await pagoExistente.save();
    }

    // Enviar email de confirmación
    try {
      const resultadoEmail = await confirmarReserva(nuevaReserva);
      if (resultadoEmail.success) {
        console.log("✅ Email de confirmación enviado correctamente");
      } else {
        console.warn("⚠️ No se pudo enviar el email de confirmación:", resultadoEmail.error);
      }
    } catch (emailError) {
      console.error("❌ Error al enviar email de confirmación:", emailError);
    }

    console.log("✅ Reserva creada automáticamente:", codigoReserva);

    return {
      error: false,
      msg: "Pago procesado exitosamente",
      reserva: nuevaReserva,
      statusCode: 200,
    };
  } catch (error) {
    console.error("❌ Error al procesar webhook:", error);
    return {
      error: true,
      msg: "Error al procesar webhook",
      detalles: error.message,
      statusCode: 500,
    };
  }
};

/**
 * Consultar estado de un pago
 */
const ConsultarPagoService = async (paymentId) => {
  try {
    const payment = new Payment(client);
    const paymentInfo = await payment.get({ id: paymentId });

    return {
      error: false,
      pago: {
        id: paymentInfo.id,
        status: paymentInfo.status,
        status_detail: paymentInfo.status_detail,
        transaction_amount: paymentInfo.transaction_amount,
        date_approved: paymentInfo.date_approved,
        external_reference: paymentInfo.external_reference,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("❌ Error al consultar pago:", error);
    return {
      error: true,
      msg: "Error al consultar pago",
      detalles: error.message,
      statusCode: 500,
    };
  }
};

module.exports = {
  CrearPreferenciaService,
  ProcesarWebhookService,
  ConsultarPagoService,
};
