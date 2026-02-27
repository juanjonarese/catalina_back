const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const PagosModel = require("../models/pagos.model");
const ReservasModel = require("../models/reservas.model");
const { confirmarReserva } = require("../helpers/mensajes.nodemailer.helper");

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 5000,
  },
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
      Math.floor(Math.random() * caracteres.length),
    );
  }

  const codigo = `RES-${año}${mes}-${codigoAleatorio}`;

  const existente = await ReservasModel.findOne({ codigoReserva: codigo });
  if (existente) return generarCodigoReserva();

  return codigo;
};

/**
 * Crear preferencia de pago
 */
const CrearPreferenciaService = async (datosReserva) => {
  try {
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

    if (!emailCliente || !precioTotal || !nombreCliente || !habitacionId) {
      return {
        error: true,
        msg: "Faltan datos requeridos",
        statusCode: 400,
      };
    }

    const montoNormalizado = Number(Number(precioTotal).toFixed(2));

    const items = [
      {
        title: `Reserva Hotel - ${tituloHabitacion || "Habitación"} #${numeroHabitacion || ""}`,
        quantity: 1,
        unit_price: montoNormalizado,
        currency_id: "ARS",
      },
    ];

    const baseURL = process.env.FRONTEND_URL || "http://localhost:5173";

    const preferenciaTempId = `PREF-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}`;

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
        metadata: {
          nombre_cliente: nombreCliente,
          email_cliente: emailCliente,
          telefono_cliente: telefonoCliente || "",
          habitacion_id: habitacionId,
          num_adultos: numAdultos,
          num_ninos: numNinos,
          fecha_check_in: fechaCheckIn,
          fecha_check_out: fechaCheckOut,
          precio_total: montoNormalizado,
          preferencia_temp_id: preferenciaTempId,
        },
        external_reference: preferenciaTempId,
      },
    });

    const nuevoPago = new PagosModel({
      mercadoPagoId: result.id,
      preferenciaId: result.id,
      monto: montoNormalizado,
      estado: "pending",
      emailPagador: emailCliente,
    });

    await nuevoPago.save();

    return {
      error: false,
      preferencia: {
        id: result.id,
        init_point: result.init_point,
        sandbox_init_point: result.sandbox_init_point,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("❌ Error al crear preferencia:", error);
    return {
      error: true,
      msg: "Error al crear preferencia",
      detalles: error.message,
      statusCode: 500,
    };
  }
};

/**
 * Procesar webhook
 */
const ProcesarWebhookService = async (data) => {
  try {
    if (data.type !== "payment") {
      return { error: false, statusCode: 200 };
    }

    const paymentId = data.data.id;
    const payment = new Payment(client);
    const paymentInfo = await payment.get({ id: paymentId });

    if (paymentInfo.status !== "approved") {
      return { error: false, statusCode: 200 };
    }

    const pagoExistente = await PagosModel.findOne({
      preferenciaId: paymentInfo.preference_id,
    });

    if (pagoExistente && pagoExistente.reservaId) {
      return { error: false, statusCode: 200 };
    }

    const metadata = paymentInfo.metadata;
    if (!metadata || !metadata.habitacion_id) {
      return { error: true, statusCode: 400 };
    }

    const codigoReserva = await generarCodigoReserva();

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
      estado: "confirmada",
      pagoId: pagoExistente ? pagoExistente._id : null,
    });

    await nuevaReserva.save();

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

    try {
      await confirmarReserva(nuevaReserva);
    } catch (err) {
      console.error("Error enviando email:", err);
    }

    return {
      error: false,
      reserva: nuevaReserva,
      statusCode: 200,
    };
  } catch (error) {
    console.error("❌ Error webhook:", error);
    return {
      error: true,
      statusCode: 500,
    };
  }
};

/**
 * Consultar pago
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
    return {
      error: true,
      statusCode: 500,
    };
  }
};

module.exports = {
  CrearPreferenciaService,
  ProcesarWebhookService,
  ConsultarPagoService,
};
