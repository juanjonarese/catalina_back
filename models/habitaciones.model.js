const { Schema, model } = require("mongoose");

const HabitacionSchema = new Schema({
  titulo: {
    type: String,
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  capacidadPersonas: {
    type: Number,
    required: true,
    min: 1,
  },
  precio: {
    type: Number,
    required: true,
    min: 0,
  },
  precioPromocion: {
    type: Number,
    min: 0,
  },
  imagenes: [{
    type: String,
  }],
  // Campos adicionales útiles
  amenidades: [{
    type: String,
  }],
  disponible: {
    type: Boolean,
    default: true,
  },
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
HabitacionSchema.pre("save", function (next) {
  this.fechaActualizacion = Date.now();
  next();
});

const HabitacionesModel = model("habitaciones", HabitacionSchema);
module.exports = HabitacionesModel;
