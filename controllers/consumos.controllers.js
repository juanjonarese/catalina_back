const ConsumoModel = require("../models/consumos.model");

const CrearConsumo = async (req, res) => {
  try {
    const consumo = new ConsumoModel(req.body);
    await consumo.save();
    res.status(201).json({ msg: "Consumo registrado", consumo });
  } catch (error) {
    console.error("Error en CrearConsumo:", error);
    res.status(500).json({ msg: "Error al registrar el consumo", error: error.message });
  }
};

const ObtenerConsumosPorPasajero = async (req, res) => {
  try {
    const consumos = await ConsumoModel.find({ pasajeroId: req.params.pasajeroId }).sort({ fechaCreacion: -1 });
    res.status(200).json(consumos);
  } catch (error) {
    console.error("Error en ObtenerConsumosPorPasajero:", error);
    res.status(500).json({ msg: "Error al obtener consumos" });
  }
};

const EliminarConsumo = async (req, res) => {
  try {
    const consumo = await ConsumoModel.findByIdAndDelete(req.params.id);
    if (!consumo) return res.status(404).json({ msg: "Consumo no encontrado" });
    res.status(200).json({ msg: "Consumo eliminado" });
  } catch (error) {
    console.error("Error en EliminarConsumo:", error);
    res.status(500).json({ msg: "Error al eliminar el consumo" });
  }
};

module.exports = { CrearConsumo, ObtenerConsumosPorPasajero, EliminarConsumo };
