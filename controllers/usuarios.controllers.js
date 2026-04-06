const bcrypt = require("bcryptjs");
const UsuariosModel = require("../models/usuarios.model");

const ObtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await UsuariosModel.find()
      .select("-passwordHash")
      .sort({ fechaCreacion: -1 });
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener usuarios" });
  }
};

const CrearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ msg: "Nombre, email y contraseña son requeridos" });
    }

    const existe = await UsuariosModel.findOne({ email: email.toLowerCase() });
    if (existe) {
      return res.status(400).json({ msg: "Ya existe un usuario con ese email" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = await UsuariosModel.create({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      rol: rol || "personal",
    });

    const { passwordHash: _, ...usuarioSinHash } = usuario.toObject();
    res.status(201).json({ msg: "Usuario creado", usuario: usuarioSinHash });
  } catch (error) {
    console.error("Error en CrearUsuario:", error);
    res.status(500).json({ msg: "Error al crear el usuario", error: error.message });
  }
};

const ActualizarUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol, activo } = req.body;
    const { id } = req.params;

    // No permitir que el superadmin se quite el rol a sí mismo
    const usuarioActual = await UsuariosModel.findById(id);
    if (!usuarioActual) return res.status(404).json({ msg: "Usuario no encontrado" });

    if (
      usuarioActual.rol === "superadmin" &&
      rol === "personal" &&
      req.usuario.id === id
    ) {
      return res.status(400).json({ msg: "No podés quitarte el rol de superadmin a vos mismo" });
    }

    const cambios = {};
    if (nombre) cambios.nombre = nombre.trim();
    if (email) {
      const emailExiste = await UsuariosModel.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
      if (emailExiste) return res.status(400).json({ msg: "Ese email ya está en uso" });
      cambios.email = email.toLowerCase().trim();
    }
    if (rol) cambios.rol = rol;
    if (activo !== undefined) cambios.activo = activo;
    if (password) {
      cambios.passwordHash = await bcrypt.hash(password, 10);
    }

    const usuario = await UsuariosModel.findByIdAndUpdate(id, cambios, { new: true }).select("-passwordHash");
    res.status(200).json({ msg: "Usuario actualizado", usuario });
  } catch (error) {
    console.error("Error en ActualizarUsuario:", error);
    res.status(500).json({ msg: "Error al actualizar el usuario", error: error.message });
  }
};

const EliminarUsuario = async (req, res) => {
  try {
    const usuario = await UsuariosModel.findById(req.params.id);
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });

    // No permitir eliminar al único superadmin
    if (usuario.rol === "superadmin") {
      const countSuperadmins = await UsuariosModel.countDocuments({ rol: "superadmin" });
      if (countSuperadmins <= 1) {
        return res.status(400).json({ msg: "No podés eliminar al único superadmin del sistema" });
      }
    }

    await UsuariosModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Usuario eliminado" });
  } catch (error) {
    console.error("Error en EliminarUsuario:", error);
    res.status(500).json({ msg: "Error al eliminar el usuario" });
  }
};

module.exports = { ObtenerUsuarios, CrearUsuario, ActualizarUsuario, EliminarUsuario };
