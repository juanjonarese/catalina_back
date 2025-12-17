const HabitacionesModel = require("../models/habitaciones.model");
const ReservasModel = require("../models/reservas.model");

// Obtener todas las habitaciones
const ObtenerHabitaciones = async (req, res) => {
  try {
    const habitaciones = await HabitacionesModel.find().sort({ fechaCreacion: -1 });
    res.status(200).json({ habitaciones });
  } catch (error) {
    console.error("Error en ObtenerHabitaciones:", error);
    res.status(500).json({ msg: "Error al obtener las habitaciones" });
  }
};

// Obtener habitación por ID
const ObtenerHabitacionPorId = async (req, res) => {
  try {
    const habitacion = await HabitacionesModel.findById(req.params.id);
    if (!habitacion) {
      return res.status(404).json({ msg: "Habitación no encontrada" });
    }
    res.status(200).json({ habitacion });
  } catch (error) {
    console.error("Error en ObtenerHabitacionPorId:", error);
    res.status(500).json({ msg: "Error al obtener la habitación" });
  }
};

// Verificar disponibilidad de habitaciones por fechas
const VerificarDisponibilidad = async (req, res) => {
  try {
    const { fechaCheckIn, fechaCheckOut, numPersonas } = req.query;

    if (!fechaCheckIn || !fechaCheckOut) {
      return res.status(400).json({ msg: "Fechas requeridas" });
    }

    const fechaEntrada = new Date(fechaCheckIn);
    const fechaSalida = new Date(fechaCheckOut);

    // Buscar reservas que se solapen con las fechas solicitadas
    const reservasOcupadas = await ReservasModel.find({
      estado: { $in: ["pendiente", "confirmada"] },
      $or: [
        {
          fechaCheckIn: { $lt: fechaSalida },
          fechaCheckOut: { $gt: fechaEntrada },
        },
      ],
    });

    // Obtener IDs de habitaciones ocupadas
    const habitacionesOcupadasIds = reservasOcupadas.map(r => r.habitacionId.toString());

    // Obtener todas las habitaciones disponibles
    const todasHabitaciones = await HabitacionesModel.find({
      disponible: true
    }).sort({ precio: 1 });

    // Filtrar habitaciones disponibles
    let habitacionesDisponibles = todasHabitaciones.filter(
      h => !habitacionesOcupadasIds.includes(h._id.toString())
    );

    // Si se especificó número de personas, filtrar por capacidad
    if (numPersonas) {
      const personas = parseInt(numPersonas);
      habitacionesDisponibles = habitacionesDisponibles.filter(
        h => h.capacidadPersonas >= personas
      );
    }

    res.status(200).json({ habitaciones: habitacionesDisponibles });
  } catch (error) {
    console.error("Error en VerificarDisponibilidad:", error);
    res.status(500).json({ msg: "Error al verificar disponibilidad" });
  }
};

// Crear habitación
const CrearHabitacion = async (req, res) => {
  try {
    const habitacion = new HabitacionesModel(req.body);
    await habitacion.save();
    res.status(201).json({ msg: "Habitación creada exitosamente", habitacion });
  } catch (error) {
    console.error("Error en CrearHabitacion:", error);
    res.status(500).json({ msg: "Error al crear la habitación", error: error.message });
  }
};

// Actualizar habitación
const ActualizarHabitacion = async (req, res) => {
  try {
    const habitacion = await HabitacionesModel.findByIdAndUpdate(
      req.params.id,
      { ...req.body, fechaActualizacion: Date.now() },
      { new: true }
    );

    if (!habitacion) {
      return res.status(404).json({ msg: "Habitación no encontrada" });
    }

    res.status(200).json({ msg: "Habitación actualizada exitosamente", habitacion });
  } catch (error) {
    console.error("Error en ActualizarHabitacion:", error);
    res.status(500).json({ msg: "Error al actualizar la habitación" });
  }
};

// Eliminar habitación
const EliminarHabitacion = async (req, res) => {
  try {
    // Verificar si hay reservas activas para esta habitación
    const reservasActivas = await ReservasModel.find({
      habitacionId: req.params.id,
      estado: { $in: ["pendiente", "confirmada"] }
    });

    if (reservasActivas.length > 0) {
      return res.status(400).json({
        msg: "No se puede eliminar la habitación porque tiene reservas activas"
      });
    }

    const habitacion = await HabitacionesModel.findByIdAndDelete(req.params.id);

    if (!habitacion) {
      return res.status(404).json({ msg: "Habitación no encontrada" });
    }

    res.status(200).json({ msg: "Habitación eliminada exitosamente" });
  } catch (error) {
    console.error("Error en EliminarHabitacion:", error);
    res.status(500).json({ msg: "Error al eliminar la habitación" });
  }
};

module.exports = {
  ObtenerHabitaciones,
  ObtenerHabitacionPorId,
  VerificarDisponibilidad,
  CrearHabitacion,
  ActualizarHabitacion,
  EliminarHabitacion,
};
