const ReservasModel = require("../models/reservas.model");

const CrearReserva = async (req, res) => {
  try {
    const reserva = new ReservasModel(req.body);
    await reserva.save();
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

module.exports = {
  CrearReserva,
  ObtenerReservas,
  ObtenerReservaPorId,
  ActualizarEstadoReserva,
  CancelarReserva,
};
