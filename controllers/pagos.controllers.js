const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const PagosModel = require("../models/pagos.model");
const ReservasModel = require("../models/reservas.model");
const { confirmarReserva } = require("../helpers/mensajes.nodemailer.helper");

// Configurar MercadoPago con el Access Token
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// Crear preferencia de pago
const CrearPreferenciaPago = async (req, res) => {
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
    } = req.body;

    // Validar datos requeridos
    if (!emailCliente || !precioTotal || !nombreCliente) {
      return res.status(400).json({
        msg: "Faltan datos requeridos: emailCliente, precioTotal, nombreCliente",
      });
    }

    // Crear preferencia de pago
    const preferenceData = {
      items: [
        {
          title: `Reserva Hotel - ${tituloHabitacion || "Habitación"} #${numeroHabitacion || ""}`,
          quantity: 1,
          unit_price: Number(precioTotal),
        },
      ],
      payer: {
        name: nombreCliente,
        email: emailCliente,
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/pago/success`,
        failure: `${process.env.FRONTEND_URL}/pago/failure`,
        pending: `${process.env.FRONTEND_URL}/pago/pending`,
      },
      auto_return: "approved",
      metadata: {
        nombre_cliente: nombreCliente,
        email_cliente: emailCliente,
        telefono_cliente: telefonoCliente,
        habitacion_id: habitacionId,
        num_adultos: numAdultos,
        num_ninos: numNinos,
        fecha_check_in: fechaCheckIn,
        fecha_check_out: fechaCheckOut,
        precio_total: precioTotal,
      },
    };

    const preference = new Preference(client);
    const result = await preference.create({ body: preferenceData });

    // Guardar registro inicial del pago en la base de datos
    const nuevoPago = new PagosModel({
      mercadoPagoId: result.body.id,
      preferenciaId: result.body.id,
      monto: precioTotal,
      estado: "pending",
      emailPagador: emailCliente,
    });
    await nuevoPago.save();

    res.status(200).json({
      msg: "Preferencia de pago creada exitosamente",
      preferenceId: result.body.id,
      initPoint: result.body.init_point, // URL de pago de MercadoPago
      sandboxInitPoint: result.body.sandbox_init_point, // URL de prueba
    });
  } catch (error) {
    console.error("❌ Error completo en CrearPreferenciaPago:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    if (error.response) {
      console.error("❌ Error response:", error.response);
    }
    res.status(500).json({
      msg: "Error al crear la preferencia de pago",
      error: error.message,
      details: error.response?.data || null,
    });
  }
};

// Webhook de MercadoPago
const WebhookMercadoPago = async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log("📩 Webhook recibido:", { type, data });

    // MercadoPago envía diferentes tipos de notificaciones
    // Solo procesamos las de tipo "payment"
    if (type === "payment" || req.query.topic === "payment") {
      const paymentId = data?.id || req.query.id;

      if (!paymentId) {
        console.warn("⚠️ Webhook sin payment ID");
        return res.status(200).send("OK");
      }

      // Obtener información del pago desde MercadoPago
      const payment = new Payment(client);
      const paymentResponse = await payment.get({ id: paymentId });
      const paymentInfo = paymentResponse;

      console.log("💳 Información del pago:", {
        id: paymentInfo.id,
        status: paymentInfo.status,
        status_detail: paymentInfo.status_detail,
      });

      // Buscar el pago en nuestra base de datos
      let pagoRegistro = await PagosModel.findOne({
        preferenciaId: paymentInfo.preference_id,
      });

      if (!pagoRegistro) {
        // Si no existe, crear nuevo registro
        pagoRegistro = new PagosModel({
          mercadoPagoId: paymentInfo.id.toString(),
          preferenciaId: paymentInfo.preference_id || "",
          monto: paymentInfo.transaction_amount,
          estado: paymentInfo.status,
          emailPagador: paymentInfo.payer?.email || "",
        });
      }

      // Actualizar datos del pago
      pagoRegistro.mercadoPagoId = paymentInfo.id.toString();
      pagoRegistro.estado = paymentInfo.status;
      pagoRegistro.estadoDetalle = paymentInfo.status_detail;
      pagoRegistro.metodoPago = paymentInfo.payment_method_id;
      pagoRegistro.tipoPago = paymentInfo.payment_type_id;
      pagoRegistro.datosMercadoPago = paymentInfo;
      await pagoRegistro.save();

      // Si el pago fue aprobado, crear la reserva
      if (paymentInfo.status === "approved" && !pagoRegistro.reservaId) {
        const metadata = paymentInfo.metadata;

        // Generar código único de reserva
        const codigoReserva = await generarCodigoReserva();

        // Crear la reserva
        const nuevaReserva = new ReservasModel({
          codigoReserva,
          nombreCliente: metadata.nombre_cliente,
          emailCliente: metadata.email_cliente,
          telefonoCliente: metadata.telefono_cliente,
          habitacionId: metadata.habitacion_id,
          numAdultos: metadata.num_adultos,
          numNinos: metadata.num_ninos,
          fechaCheckIn: metadata.fecha_check_in,
          fechaCheckOut: metadata.fecha_check_out,
          precioTotal: metadata.precio_total,
          estado: "confirmada", // Estado confirmada porque ya pagó
          pagoId: pagoRegistro._id,
        });
        await nuevaReserva.save();
        await nuevaReserva.populate("habitacionId");

        // Actualizar el pago con el ID de la reserva
        pagoRegistro.reservaId = nuevaReserva._id;
        await pagoRegistro.save();

        // Enviar email de confirmación
        try {
          const resultadoEmail = await confirmarReserva(nuevaReserva);
          if (resultadoEmail.success) {
            console.log("✅ Email de confirmación enviado correctamente");
          } else {
            console.warn(
              "⚠️ No se pudo enviar el email de confirmación:",
              resultadoEmail.error
            );
          }
        } catch (emailError) {
          console.error("❌ Error al enviar email de confirmación:", emailError);
        }

        console.log("✅ Reserva creada automáticamente:", codigoReserva);
      }
    }

    // Siempre responder 200 OK para que MercadoPago no reintente
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error en WebhookMercadoPago:", error);
    // Aún con error, responder 200 para evitar reintentos
    res.status(200).send("OK");
  }
};

// Obtener estado de un pago por ID de reserva
const ObtenerEstadoPago = async (req, res) => {
  try {
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

// Función auxiliar para generar código de reserva
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

module.exports = {
  CrearPreferenciaPago,
  WebhookMercadoPago,
  ObtenerEstadoPago,
};
