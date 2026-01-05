const { Schema, model } = require("mongoose");

const PagoSchema = new Schema({
  // ID de pago de MercadoPago
  mercadoPagoId: {
    type: String,
    required: true,
    unique: true,
  },

  // Referencia a la reserva
  reservaId: {
    type: Schema.Types.ObjectId,
    ref: "reservas",
    required: false, // Al crear el pago, aún no existe la reserva
  },

  // ID de preferencia de MercadoPago
  preferenciaId: {
    type: String,
    required: true,
  },

  // Monto del pago
  monto: {
    type: Number,
    required: true,
    min: 0,
  },

  // Estado del pago en MercadoPago
  estado: {
    type: String,
    enum: [
      "pending",     // Pendiente de pago
      "approved",    // Aprobado
      "authorized",  // Autorizado
      "in_process",  // En proceso
      "in_mediation",// En mediación
      "rejected",    // Rechazado
      "cancelled",   // Cancelado
      "refunded",    // Reembolsado
      "charged_back" // Contracargo
    ],
    default: "pending",
  },

  // Detalle del estado
  estadoDetalle: {
    type: String,
    required: false,
  },

  // Método de pago utilizado
  metodoPago: {
    type: String,
    required: false,
  },

  // Tipo de pago (credit_card, debit_card, ticket, etc.)
  tipoPago: {
    type: String,
    required: false,
  },

  // Email del pagador
  emailPagador: {
    type: String,
    required: false,
  },

  // Datos completos de MercadoPago (para auditoría)
  datosMercadoPago: {
    type: Schema.Types.Mixed,
    required: false,
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
PagoSchema.pre("save", function (next) {
  this.fechaActualizacion = Date.now();
  next();
});

const PagosModel = model("pagos", PagoSchema);
module.exports = PagosModel;
