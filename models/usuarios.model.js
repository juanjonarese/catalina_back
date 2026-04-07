const mongoose = require("mongoose");
const { Schema } = mongoose;

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

const UsuariosModel = mongoose.models.usuarios || mongoose.model("usuarios", UsuarioSchema);
module.exports = UsuariosModel;
