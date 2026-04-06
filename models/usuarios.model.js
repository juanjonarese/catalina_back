const { Schema, model } = require("mongoose");

const UsuarioSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  rol: {
    type: String,
    enum: ["superadmin", "personal"],
    default: "personal",
  },
  activo: {
    type: Boolean,
    default: true,
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
});

const UsuariosModel = model("usuarios", UsuarioSchema);
module.exports = UsuariosModel;
