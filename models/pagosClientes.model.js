const { Schema, model } = require("mongoose");

const PagoClienteSchema = new Schema({
  clienteId: { type: Schema.Types.ObjectId, ref: "clientes", required: true },
  reservaId: { type: Schema.Types.ObjectId, ref: "reservas", default: null },
  method:    { type: String, enum: ["efectivo", "transferencia", "mercadopago", "otro"], required: true },
  amount:    { type: Number, required: true, min: 0.01 },
  date:      { type: Date, required: true },
  reference: { type: String, default: "" },
  notes:     { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = model("pagosClientes", PagoClienteSchema);
