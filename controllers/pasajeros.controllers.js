const PasajerosModel = require("../models/pasajeros.model");

const CrearPasajero = async (req, res) => {
  try {
    const pasajero = new PasajerosModel(req.body);
    await pasajero.save();
    res.status(201).json({ msg: "Pasajero registrado exitosamente", pasajero });
  } catch (error) {
    console.error("Error en CrearPasajero:", error);
    res.status(500).json({ msg: "Error al registrar el pasajero", error: error.message });
  }
};

const ObtenerPasajeros = async (req, res) => {
  try {
    const pasajeros = await PasajerosModel.find()
      .sort({ fechaCreacion: -1 });
    res.status(200).json(pasajeros);
  } catch (error) {
    console.error("Error en ObtenerPasajeros:", error);
    res.status(500).json({ msg: "Error al obtener los pasajeros" });
  }
};

const ObtenerPasajeroPorId = async (req, res) => {
  try {
    const pasajero = await PasajerosModel.findById(req.params.id);
    if (!pasajero) {
      return res.status(404).json({ msg: "Pasajero no encontrado" });
    }
    res.status(200).json({ pasajero });
  } catch (error) {
    console.error("Error en ObtenerPasajeroPorId:", error);
    res.status(500).json({ msg: "Error al obtener el pasajero" });
  }
};

const ActualizarPasajero = async (req, res) => {
  try {
    const pasajero = await PasajerosModel.findByIdAndUpdate(
      req.params.id,
      { ...req.body, fechaActualizacion: Date.now() },
      { new: true, runValidators: true }
    );
    if (!pasajero) {
      return res.status(404).json({ msg: "Pasajero no encontrado" });
    }
    res.status(200).json({ msg: "Pasajero actualizado", pasajero });
  } catch (error) {
    console.error("Error en ActualizarPasajero:", error);
    res.status(500).json({ msg: "Error al actualizar el pasajero" });
  }
};

const EliminarPasajero = async (req, res) => {
  try {
    const pasajero = await PasajerosModel.findByIdAndDelete(req.params.id);
    if (!pasajero) {
      return res.status(404).json({ msg: "Pasajero no encontrado" });
    }
    res.status(200).json({ msg: "Pasajero eliminado exitosamente" });
  } catch (error) {
    console.error("Error en EliminarPasajero:", error);
    res.status(500).json({ msg: "Error al eliminar el pasajero" });
  }
};

module.exports = {
  CrearPasajero,
  ObtenerPasajeros,
  ObtenerPasajeroPorId,
  ActualizarPasajero,
  EliminarPasajero,
};
