const { Schema, model } = require("mongoose");

const ConsumoSchema = new Schema({
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
    required: false,
    default: null,
  },
  descripcion: {
    type: String,
    required: true,
    trim: true,
  },
  monto: {
    type: Number,
    required: true,
    min: 0,
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
});

const ConsumoModel = model("consumos", ConsumoSchema);
module.exports = ConsumoModel;
