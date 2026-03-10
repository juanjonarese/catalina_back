const { Schema, model } = require("mongoose");

const TemporadaSchema = new Schema({
  nombre:     { type: String, required: true, trim: true },
  color:      { type: String, enum: ["high", "mid", "low", "special", "green"], required: true },
  fechaDesde: { type: String, required: true }, // YYYY-MM-DD
  fechaHasta: { type: String, required: true }, // YYYY-MM-DD
  descripcion:{ type: String, default: "" },
  precios: [{
    habitacionId: { type: Schema.Types.ObjectId, ref: "habitaciones", required: true },
    precio:       { type: Number, required: true, min: 0 },
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = model("temporadas", TemporadaSchema);
