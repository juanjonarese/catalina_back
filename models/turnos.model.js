const { Schema, model } = require("mongoose");

const TurnoSchema = new Schema({
  empleado: {
    type: String,
    required: true,
    trim: true,
  },
  fechaApertura: {
    type: Date,
    default: Date.now,
  },
  fechaCierre: {
    type: Date,
    default: null,
  },
  estado: {
    type: String,
    enum: ["abierto", "cerrado"],
    default: "abierto",
  },
  // Resumen de cobros al cerrar el turno
  resumen: {
    efectivo: { type: Number, default: 0 },
    transferencia: { type: Number, default: 0 },
    mercadopago: { type: Number, default: 0 },
    otro: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },

  // Retiro de caja realizado al cierre
  retiro: {
    type: Number,
    default: 0,
  },

  // Nota para el turno siguiente
  notaParaSiguiente: {
    type: String,
    default: "",
    trim: true,
  },
});

const TurnoModel = model("turnos", TurnoSchema);
module.exports = TurnoModel;
