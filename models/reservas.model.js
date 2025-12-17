const { Schema, model } = require("mongoose");

const ReservaSchema = new Schema({
  // Información del cliente
  nombreCliente: {
    type: String,
    required: true,
  },
  emailCliente: {
    type: String,
    required: true,
  },
  telefonoCliente: {
    type: String,
    required: true,
  },

  // Referencia a la habitación
  habitacionId: {
    type: Schema.Types.ObjectId,
    ref: "habitaciones",
    required: true,
  },

  // Huéspedes
  numAdultos: {
    type: Number,
    required: true,
    min: 1,
  },
  numNinos: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },

  // Fechas
  fechaCheckIn: {
    type: Date,
    required: true,
  },
  fechaCheckOut: {
    type: Date,
    required: true,
  },

  // Estado de la reserva
  estado: {
    type: String,
    enum: ["pendiente", "confirmada", "completada", "cancelada"],
    default: "pendiente",
  },

  // Precio
  precioTotal: {
    type: Number,
    required: true,
    min: 0,
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
ReservaSchema.pre("save", function (next) {
  this.fechaActualizacion = Date.now();
  next();
});

const ReservasModel = model("reservas", ReservaSchema);
module.exports = ReservasModel;
