const TurnoModel = require("../models/turnos.model");
const CobroModel = require("../models/cobros.model");
const PasajerosModel = require("../models/pasajeros.model");
const ReservasModel = require("../models/reservas.model");

const AbrirTurno = async (req, res) => {
  try {
    // Solo puede haber un turno abierto a la vez
    const turnoAbierto = await TurnoModel.findOne({ estado: "abierto" });
    if (turnoAbierto) {
      return res.status(400).json({ msg: "Ya hay un turno abierto", turno: turnoAbierto });
    }
    const turno = new TurnoModel({ empleado: req.body.empleado });
    await turno.save();
    res.status(201).json({ msg: "Turno abierto", turno });
  } catch (error) {
    console.error("Error en AbrirTurno:", error);
    res.status(500).json({ msg: "Error al abrir el turno", error: error.message });
  }
};

const ObtenerTurnoActual = async (req, res) => {
  try {
    const turno = await TurnoModel.findOne({ estado: "abierto" });
    res.status(200).json({ turno: turno || null });
  } catch (error) {
    console.error("Error en ObtenerTurnoActual:", error);
    res.status(500).json({ msg: "Error al obtener el turno actual" });
  }
};

const ObtenerTurnos = async (req, res) => {
  try {
    const turnos = await TurnoModel.find().sort({ fechaApertura: -1 }).limit(50);
    res.status(200).json(turnos);
  } catch (error) {
    console.error("Error en ObtenerTurnos:", error);
    res.status(500).json({ msg: "Error al obtener los turnos" });
  }
};

const CerrarTurno = async (req, res) => {
  try {
    const turno = await TurnoModel.findById(req.params.id);
    if (!turno) return res.status(404).json({ msg: "Turno no encontrado" });
    if (turno.estado === "cerrado") return res.status(400).json({ msg: "El turno ya está cerrado" });

    // Calcular resumen sumando todos los cobros del turno
    const cobros = await CobroModel.find({ turnoId: turno._id });

    const resumen = { efectivo: 0, transferencia: 0, mercadopago: 0, otro: 0, total: 0 };
    cobros.forEach((c) => {
      if (c.metodoPago !== "sin_cobro") {
        resumen[c.metodoPago] = (resumen[c.metodoPago] || 0) + c.saldoCobrado;
        resumen.total += c.saldoCobrado;
      }
    });

    turno.estado = "cerrado";
    turno.fechaCierre = Date.now();
    turno.resumen = resumen;
    if (req.body.retiro != null) turno.retiro = Number(req.body.retiro) || 0;
    if (req.body.notaParaSiguiente != null) turno.notaParaSiguiente = req.body.notaParaSiguiente;
    await turno.save();

    res.status(200).json({ msg: "Turno cerrado", turno, cobros });
  } catch (error) {
    console.error("Error en CerrarTurno:", error);
    res.status(500).json({ msg: "Error al cerrar el turno", error: error.message });
  }
};

// Resumen completo para el modal de apertura de turno al hacer login
const ResumenApertura = async (req, res) => {
  try {
    // 1. Pasajeros activos
    const pasajerosActivos = await PasajerosModel.find({ activo: { $ne: false } })
      .sort({ checkin: 1 })
      .select("nombre dni habitacion checkin checkout reservaId");

    // 2. Reservas de hoy (check-in o check-out hoy)
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
    const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

    const reservasCheckInHoy = await ReservasModel.find({
      fechaCheckIn: { $gte: inicioDia, $lte: finDia },
      estado: { $in: ["pendiente", "confirmada"] },
    })
      .populate("habitacionId", "numero titulo")
      .sort({ fechaCheckIn: 1 })
      .select("codigoReserva nombreCliente habitacionId fechaCheckIn fechaCheckOut precioTotal pagoId estado");

    const reservasCheckOutHoy = await ReservasModel.find({
      fechaCheckOut: { $gte: inicioDia, $lte: finDia },
      estado: { $in: ["confirmada"] },
    })
      .populate("habitacionId", "numero titulo")
      .sort({ fechaCheckOut: 1 })
      .select("codigoReserva nombreCliente habitacionId fechaCheckIn fechaCheckOut precioTotal pagoId estado");

    // 3. Turno actual + sus cobros (para mostrar resumen del turno saliente en cambio de turno)
    const turnoActual = await TurnoModel.findOne({ estado: "abierto" });
    let cobrosDelTurnoActual = [];
    if (turnoActual) {
      cobrosDelTurnoActual = await CobroModel.find({ turnoId: turnoActual._id })
        .sort({ fechaCobro: -1 })
        .select("nombrePasajero habitacion totalNoches totalConsumos saldoCobrado metodoPago fechaCobro");
    }

    // 4. Último turno cerrado (resumen de caja anterior)
    const ultimoTurnoCerrado = await TurnoModel.findOne({ estado: "cerrado" }).sort({ fechaCierre: -1 });

    res.status(200).json({
      pasajerosActivos,
      reservasCheckInHoy,
      reservasCheckOutHoy,
      turnoActual: turnoActual || null,
      cobrosDelTurnoActual,
      ultimoTurnoCerrado: ultimoTurnoCerrado || null,
    });
  } catch (error) {
    console.error("Error en ResumenApertura:", error);
    res.status(500).json({ msg: "Error al obtener el resumen de apertura", error: error.message });
  }
};

// Cierra el turno abierto actual y abre uno nuevo para el empleado entrante
const CambioTurno = async (req, res) => {
  try {
    const { empleado } = req.body;
    if (!empleado) return res.status(400).json({ msg: "Nombre del empleado requerido" });

    const turnoSaliente = await TurnoModel.findOne({ estado: "abierto" });
    if (!turnoSaliente) return res.status(400).json({ msg: "No hay turno abierto para cerrar" });

    // Calcular resumen del turno saliente
    const cobros = await CobroModel.find({ turnoId: turnoSaliente._id });
    const resumen = { efectivo: 0, transferencia: 0, mercadopago: 0, otro: 0, total: 0 };
    cobros.forEach((c) => {
      if (c.metodoPago !== "sin_cobro") {
        resumen[c.metodoPago] = (resumen[c.metodoPago] || 0) + c.saldoCobrado;
        resumen.total += c.saldoCobrado;
      }
    });

    turnoSaliente.estado = "cerrado";
    turnoSaliente.fechaCierre = Date.now();
    turnoSaliente.resumen = resumen;
    await turnoSaliente.save();

    // Abrir turno para el empleado entrante
    const turnoEntrante = new TurnoModel({ empleado });
    await turnoEntrante.save();

    res.status(201).json({
      msg: "Cambio de turno realizado",
      turnoCerrado: turnoSaliente,
      turnoNuevo: turnoEntrante,
    });
  } catch (error) {
    console.error("Error en CambioTurno:", error);
    res.status(500).json({ msg: "Error al realizar el cambio de turno", error: error.message });
  }
};

module.exports = { AbrirTurno, ObtenerTurnoActual, ObtenerTurnos, CerrarTurno, ResumenApertura, CambioTurno };
