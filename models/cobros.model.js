const { Schema, model } = require("mongoose");

const CobroSchema = new Schema({
  pasajeroId: {
    type: Schema.Types.ObjectId,
    ref: "pasajeros",
    required: true,
  },
  reservaId: {
    type: Schema.Types.ObjectId,
    ref: "reservas",
    required: false,
    default: null,
  },
  turnoId: {
    type: Schema.Types.ObjectId,
    ref: "turnos",
    required: true,
  },

  // Snapshot de datos del pasajero al momento del cobro
  nombrePasajero: { type: String, required: true },
  habitacion: { type: String, required: true },

  // Desglose de noches
  noches: { type: Number, default: 0 },
  precioPorNoche: { type: Number, default: 0 },
  totalNoches: { type: Number, default: 0 },

  // Consumos incluidos en este cobro
  consumos: [
    {
      descripcion: { type: String },
      monto: { type: Number },
    },
  ],
  totalConsumos: { type: Number, default: 0 },

  // Totales
  totalGeneral: { type: Number, default: 0 },
  montoPagadoPrevio: { type: Number, default: 0 }, // pagado via MercadoPago antes del checkout
  saldoCobrado: { type: Number, default: 0 },      // lo que se cobró en este turno

  // Método de pago utilizado en el cobro del saldo
  metodoPago: {
    type: String,
    enum: ["efectivo", "transferencia", "mercadopago", "otro", "sin_cobro"],
    default: "sin_cobro",
  },

  fechaCobro: {
    type: Date,
    default: Date.now,
  },
});

const CobroModel = model("cobros", CobroSchema);
module.exports = CobroModel;
