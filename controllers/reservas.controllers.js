const ReservasModel = require("../models/reservas.model");
const { confirmarReserva } = require("../helpers/mensajes.nodemailer.helper");

// Función para generar código único de reserva
const generarCodigoReserva = async () => {
  const año = new Date().getFullYear();
  const mes = String(new Date().getMonth() + 1).padStart(2, '0');

  // Generar código aleatorio de 6 caracteres alfanuméricos
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigoAleatorio = '';
  for (let i = 0; i < 6; i++) {
    codigoAleatorio += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }

  const codigo = `RES-${año}${mes}-${codigoAleatorio}`;

  // Verificar que el código no exista
  const existente = await ReservasModel.findOne({ codigoReserva: codigo });
  if (existente) {
    // Si existe, generar otro recursivamente
    return generarCodigoReserva();
  }

  return codigo;
};

const CrearReserva = async (req, res) => {
  try {
    // Generar código único de reserva
    const codigoReserva = await generarCodigoReserva();

    const reserva = new ReservasModel({
      ...req.body,
      codigoReserva
    });
    await reserva.save();

    // Hacer populate de habitacionId para tener toda la información
    await reserva.populate('habitacionId');

    // Enviar email de confirmación
    try {
      const resultadoEmail = await confirmarReserva(reserva);
      if (resultadoEmail.success) {
        console.log("✅ Email de confirmación enviado correctamente");
      } else {
        console.warn("⚠️ No se pudo enviar el email de confirmación:", resultadoEmail.error);
      }
    } catch (emailError) {
      // No fallar la creación de la reserva si falla el email
      console.error("❌ Error al enviar email de confirmación:", emailError);
    }

    res.status(201).json({ msg: "Reserva creada exitosamente", reserva });
  } catch (error) {
    console.error("Error en CrearReserva:", error);
    res.status(500).json({ msg: "Error al crear la reserva", error: error.message });
  }
};

const ObtenerReservas = async (req, res) => {
  try {
    const reservas = await ReservasModel.find()
      .populate('habitacionId')
      .sort({ fechaCreacion: -1 });
    res.status(200).json({ reservas });
  } catch (error) {
    console.error("Error en ObtenerReservas:", error);
    res.status(500).json({ msg: "Error al obtener las reservas" });
  }
};

const ObtenerReservaPorId = async (req, res) => {
  try {
    const reserva = await ReservasModel.findById(req.params.id).populate('habitacionId');
    if (!reserva) {
      return res.status(404).json({ msg: "Reserva no encontrada" });
    }
    res.status(200).json({ reserva });
  } catch (error) {
    console.error("Error en ObtenerReservaPorId:", error);
    res.status(500).json({ msg: "Error al obtener la reserva" });
  }
};

const ActualizarEstadoReserva = async (req, res) => {
  try {
    const reserva = await ReservasModel.findByIdAndUpdate(
      req.params.id,
      { estado: req.body.estado, fechaActualizacion: Date.now() },
      { new: true }
    );
    if (!reserva) {
      return res.status(404).json({ msg: "Reserva no encontrada" });
    }
    res.status(200).json({ msg: "Estado actualizado", reserva });
  } catch (error) {
    console.error("Error en ActualizarEstadoReserva:", error);
    res.status(500).json({ msg: "Error al actualizar la reserva" });
  }
};

const CancelarReserva = async (req, res) => {
  try {
    const reserva = await ReservasModel.findByIdAndUpdate(
      req.params.id,
      { estado: "cancelada", fechaActualizacion: Date.now() },
      { new: true }
    );
    if (!reserva) {
      return res.status(404).json({ msg: "Reserva no encontrada" });
    }
    res.status(200).json({ msg: "Reserva cancelada", reserva });
  } catch (error) {
    console.error("Error en CancelarReserva:", error);
    res.status(500).json({ msg: "Error al cancelar la reserva" });
  }
};

const EliminarReserva = async (req, res) => {
  try {
    // Verificar que la reserva exista y esté cancelada
    const reserva = await ReservasModel.findById(req.params.id);

    if (!reserva) {
      return res.status(404).json({ msg: "Reserva no encontrada" });
    }

    if (reserva.estado !== "cancelada") {
      return res.status(400).json({
        msg: "Solo se pueden eliminar reservas canceladas"
      });
    }

    await ReservasModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Reserva eliminada exitosamente" });
  } catch (error) {
    console.error("Error en EliminarReserva:", error);
    res.status(500).json({ msg: "Error al eliminar la reserva" });
  }
};

module.exports = {
  CrearReserva,
  ObtenerReservas,
  ObtenerReservaPorId,
  ActualizarEstadoReserva,
  CancelarReserva,
  EliminarReserva,
};
