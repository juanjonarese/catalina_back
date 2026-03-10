const express     = require("express");
const router      = express.Router();
const Temporada   = require("../models/temporadas.model");
const Habitacion  = require("../models/habitaciones.model");

/* ── GET /temporadas ─────────────────────────────────────────────
   Devuelve todas las temporadas (con precios populados)
   + lista de habitaciones para que el frontend arme el formulario
────────────────────────────────────────────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const [temporadas, habitaciones] = await Promise.all([
      Temporada.find()
        .populate("precios.habitacionId", "numero titulo precio disponible")
        .sort({ fechaDesde: 1 })
        .lean(),
      Habitacion.find({ disponible: true }).sort({ numero: 1 }).lean(),
    ]);
    res.json({ temporadas, habitaciones });
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener tarifas", error: err.message });
  }
});

/* ── POST /temporadas ───────────────────────────────────────────── */
router.post("/", async (req, res) => {
  try {
    const { nombre, color, fechaDesde, fechaHasta, descripcion, precios } = req.body;

    if (!nombre || !color || !fechaDesde || !fechaHasta)
      return res.status(400).json({ msg: "Nombre, color y fechas son requeridos" });

    if (fechaHasta < fechaDesde)
      return res.status(400).json({ msg: "La fecha de fin debe ser posterior al inicio" });

    const temporada = await Temporada.create({
      nombre, color, fechaDesde, fechaHasta,
      descripcion: descripcion || "",
      precios: (precios || []).filter(p => p.habitacionId && p.precio > 0),
    });

    const populated = await temporada.populate("precios.habitacionId", "numero titulo precio disponible");
    res.status(201).json({ msg: "Temporada creada", temporada: populated });
  } catch (err) {
    res.status(500).json({ msg: "Error al crear temporada", error: err.message });
  }
});

/* ── PUT /temporadas/:id ────────────────────────────────────────── */
router.put("/:id", async (req, res) => {
  try {
    const { nombre, color, fechaDesde, fechaHasta, descripcion, precios } = req.body;

    if (!nombre || !color || !fechaDesde || !fechaHasta)
      return res.status(400).json({ msg: "Nombre, color y fechas son requeridos" });

    if (fechaHasta < fechaDesde)
      return res.status(400).json({ msg: "La fecha de fin debe ser posterior al inicio" });

    const temporada = await Temporada.findByIdAndUpdate(
      req.params.id,
      {
        nombre, color, fechaDesde, fechaHasta,
        descripcion: descripcion || "",
        precios: (precios || []).filter(p => p.habitacionId && p.precio > 0),
      },
      { new: true }
    ).populate("precios.habitacionId", "numero titulo precio disponible");

    if (!temporada) return res.status(404).json({ msg: "Temporada no encontrada" });
    res.json({ msg: "Temporada actualizada", temporada });
  } catch (err) {
    res.status(500).json({ msg: "Error al actualizar temporada", error: err.message });
  }
});

/* ── DELETE /temporadas/:id ─────────────────────────────────────── */
router.delete("/:id", async (req, res) => {
  try {
    const temporada = await Temporada.findByIdAndDelete(req.params.id);
    if (!temporada) return res.status(404).json({ msg: "Temporada no encontrada" });
    res.json({ msg: "Temporada eliminada" });
  } catch (err) {
    res.status(500).json({ msg: "Error al eliminar temporada", error: err.message });
  }
});

module.exports = router;
