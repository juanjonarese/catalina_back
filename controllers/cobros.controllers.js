const CobroModel = require("../models/cobros.model");
const PasajerosModel = require("../models/pasajeros.model");
const ReservasModel = require("../models/reservas.model");
const PagosModel = require("../models/pagos.model");
const ConsumoModel = require("../models/consumos.model");

// Devuelve el estado de cuenta completo de una habitación para el checkout
const ObtenerCuentaHabitacion = async (req, res) => {
  try {
    const { habitacion } = req.params;

    // Todos los pasajeros activos de esa habitación
    const pasajeros = await PasajerosModel.find({ habitacion, activo: { $ne: false } });
    if (!pasajeros.length) return res.status(404).json({ msg: "No hay pasajeros activos en esa habitación" });

    // Tomar el primer pasajero como referencia para las fechas y reserva
    const pasajeroRef = pasajeros[0];

    let reserva = null;
    let pago = null;
    let pagadoPrevio = 0;

    if (pasajeroRef.reservaId) {
      reserva = await ReservasModel.findById(pasajeroRef.reservaId).populate("habitacionId");
      if (reserva && reserva.pagoId) {
        pago = await PagosModel.findById(reserva.pagoId);
        if (pago && pago.estado === "approved") {
          pagadoPrevio = reserva.precioTotal;
        }
      }
    }

    // Calcular noches
    const checkin = new Date(pasajeroRef.checkin);
    const checkout = new Date(pasajeroRef.checkout);
    const noches = Math.max(1, Math.round((checkout - checkin) / (1000 * 60 * 60 * 24)));

    let precioPorNoche = 0;
    let totalNoches = 0;
    if (reserva) {
      precioPorNoche = noches > 0 ? Number((reserva.precioTotal / noches).toFixed(2)) : reserva.precioTotal;
      totalNoches = reserva.precioTotal;
    }

    // Consumos de la habitación
    const consumos = await ConsumoModel.find({ habitacion }).sort({ fechaCreacion: 1 });
    const totalConsumos = consumos.reduce((sum, c) => sum + c.monto, 0);

    const totalGeneral = totalNoches + totalConsumos;
    const saldoPendiente = Math.max(0, totalGeneral - pagadoPrevio);

    res.status(200).json({
      habitacion,
      pasajeros,
      pasajeroRef,
      reserva,
      pago,
      noches,
      precioPorNoche,
      totalNoches,
      consumos,
      totalConsumos,
      totalGeneral,
      pagadoPrevio,
      saldoPendiente,
    });
  } catch (error) {
    console.error("Error en ObtenerCuentaHabitacion:", error);
    res.status(500).json({ msg: "Error al obtener cuenta de la habitación", error: error.message });
  }
};

const RegistrarCobro = async (req, res) => {
  try {
    const cobro = new CobroModel(req.body);
    await cobro.save();

    // Marcar TODOS los pasajeros de esa habitación como inactivos
    await PasajerosModel.updateMany(
      { habitacion: req.body.habitacion, activo: { $ne: false } },
      { activo: false }
    );

    res.status(201).json({ msg: "Cobro registrado", cobro });
  } catch (error) {
    console.error("Error en RegistrarCobro:", error);
    res.status(500).json({ msg: "Error al registrar el cobro", error: error.message });
  }
};

const ObtenerCobrosPorTurno = async (req, res) => {
  try {
    const cobros = await CobroModel.find({ turnoId: req.params.turnoId }).sort({ fechaCobro: -1 });
    res.status(200).json(cobros);
  } catch (error) {
    console.error("Error en ObtenerCobrosPorTurno:", error);
    res.status(500).json({ msg: "Error al obtener cobros del turno" });
  }
};

module.exports = { ObtenerCuentaHabitacion, RegistrarCobro, ObtenerCobrosPorTurno };
