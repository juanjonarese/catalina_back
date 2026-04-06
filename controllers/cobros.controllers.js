const CobroModel = require("../models/cobros.model");
const PasajerosModel = require("../models/pasajeros.model");
const ReservasModel = require("../models/reservas.model");
const PagosModel = require("../models/pagos.model");
const ConsumoModel = require("../models/consumos.model");

// Devuelve el estado de cuenta completo de un pasajero para el checkout
const ObtenerCuentaPasajero = async (req, res) => {
  try {
    const pasajero = await PasajerosModel.findById(req.params.pasajeroId);
    if (!pasajero) return res.status(404).json({ msg: "Pasajero no encontrado" });

    let reserva = null;
    let pago = null;
    let pagadoPrevio = 0;

    if (pasajero.reservaId) {
      reserva = await ReservasModel.findById(pasajero.reservaId).populate("habitacionId");
      if (reserva && reserva.pagoId) {
        pago = await PagosModel.findById(reserva.pagoId);
        if (pago && pago.estado === "approved") {
          pagadoPrevio = reserva.precioTotal;
        }
      }
    }

    // Calcular noches
    const checkin = new Date(pasajero.checkin);
    const checkout = new Date(pasajero.checkout);
    const noches = Math.max(1, Math.round((checkout - checkin) / (1000 * 60 * 60 * 24)));

    // Precio por noche: si tiene reserva, dividir el precio total entre las noches
    let precioPorNoche = 0;
    let totalNoches = 0;
    if (reserva) {
      precioPorNoche = noches > 0 ? Number((reserva.precioTotal / noches).toFixed(2)) : reserva.precioTotal;
      totalNoches = reserva.precioTotal;
    }

    // Consumos del pasajero
    const consumos = await ConsumoModel.find({ pasajeroId: pasajero._id }).sort({ fechaCreacion: 1 });
    const totalConsumos = consumos.reduce((sum, c) => sum + c.monto, 0);

    const totalGeneral = totalNoches + totalConsumos;
    const saldoPendiente = Math.max(0, totalGeneral - pagadoPrevio);

    res.status(200).json({
      pasajero,
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
    console.error("Error en ObtenerCuentaPasajero:", error);
    res.status(500).json({ msg: "Error al obtener cuenta del pasajero", error: error.message });
  }
};

const RegistrarCobro = async (req, res) => {
  try {
    const cobro = new CobroModel(req.body);
    await cobro.save();

    // Marcar al pasajero como inactivo (ya se retiró)
    await PasajerosModel.findByIdAndUpdate(req.body.pasajeroId, {
      activo: false,
      fechaActualizacion: Date.now(),
    });

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

module.exports = { ObtenerCuentaPasajero, RegistrarCobro, ObtenerCobrosPorTurno };
