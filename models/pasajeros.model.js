const { Schema, model } = require("mongoose");

const PasajeroSchema = new Schema({
  // Información personal
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  dni: {
    type: String,
    required: true,
    trim: true,
  },
  edad: {
    type: Number,
    required: true,
    min: 1,
    max: 120,
  },
  nacionalidad: {
    type: String,
    required: true,
    trim: true,
  },
  telefono: {
    type: String,
    required: true,
    trim: true,
  },

  // Información de estadía
  checkin: {
    type: Date,
    required: true,
  },
  checkout: {
    type: Date,
    required: true,
  },
  habitacion: {
    type: String,
    required: true,
    trim: true,
  },

  // Firma digital (almacenada como base64 string)
  firma: {
    type: String,
    required: true,
  },

  // Fechas de registro y actualización
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now,
  },
});

// Actualizar fecha de modificación antes de guardar
PasajeroSchema.pre("save", function (next) {
  this.fechaActualizacion = Date.now();
  next();
});

const PasajerosModel = model("pasajeros", PasajeroSchema);
module.exports = PasajerosModel;
