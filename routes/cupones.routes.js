const express = require("express");
const router  = express.Router();
const Cupon   = require("../models/cupones.model");

const todayISO = () => new Date().toISOString().split("T")[0];

function getCuponStatus(c) {
  if (c.state === "inactive")                              return "inactive";
  if (c.dateTo < todayISO())                              return "expired";
  if (c.maxUses !== null && c.usedCount >= c.maxUses)     return "expired";
  return "active";
}

/* ── GET /cupones ────────────────────────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const cupones = await Cupon.find().sort({ createdAt: -1 }).lean();
    // Attach computed status
    const enriched = cupones.map(c => ({ ...c, status: getCuponStatus(c) }));
    res.json({ cupones: enriched });
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener cupones", error: err.message });
  }
});

/* ── GET /cupones/validar — validación pública para el checkout ─ */
router.get("/validar", async (req, res) => {
  try {
    const { codigo, noches, tipoHabitacion } = req.query;
    if (!codigo) return res.status(400).json({ error: "notfound" });

    const c = await Cupon.findOne({ code: codigo.toUpperCase().trim() });
    if (!c)                                                return res.status(404).json({ error: "notfound" });
    if (c.state !== "active")                              return res.status(400).json({ error: "inactive" });
    if (c.dateTo < todayISO())                             return res.status(400).json({ error: "expired" });
    if (c.dateFrom > todayISO())                           return res.status(400).json({ error: "notyet", from: c.dateFrom });
    if (c.maxUses !== null && c.usedCount >= c.maxUses)    return res.status(400).json({ error: "maxused" });
    if (noches && (c.minNights || 1) > parseInt(noches))  return res.status(400).json({ error: "minnights", min: c.minNights });
    if (tipoHabitacion && !c.scope.includes("all") && !c.scope.includes(tipoHabitacion)) {
      return res.status(400).json({ error: "scope", scope: c.scope });
    }

    res.json({ code: c.code, name: c.name, type: c.type, value: c.value, scope: c.scope, minNights: c.minNights });
  } catch (err) {
    res.status(500).json({ error: "server", message: err.message });
  }
});

/* ── POST /cupones ───────────────────────────────────────────── */
router.post("/", async (req, res) => {
  try {
    const { code, name, desc, type, value, dateFrom, dateTo,
            scope, minNights, maxUses, state } = req.body;

    if (!code || !name || !type || !dateFrom || !dateTo)
      return res.status(400).json({ msg: "Código, nombre, tipo y fechas son requeridos" });
    if (dateTo < dateFrom)
      return res.status(400).json({ msg: "La fecha de fin debe ser posterior al inicio" });
    if (type !== "free" && (!value || value <= 0))
      return res.status(400).json({ msg: "Ingresá el valor del descuento" });

    const existe = await Cupon.findOne({ code: code.toUpperCase().trim() });
    if (existe) return res.status(400).json({ msg: `El código ${code.toUpperCase()} ya existe` });

    const cupon = await Cupon.create({
      code:      code.toUpperCase().trim(),
      name, desc: desc || "",
      type,
      value:     type === "free" ? 1 : Number(value),
      dateFrom, dateTo,
      scope:     Array.isArray(scope) && scope.length ? scope : ["all"],
      minNights: minNights || 1,
      maxUses:   maxUses ? Number(maxUses) : null,
      state:     state || "active",
    });

    res.status(201).json({ msg: "Cupón creado", cupon });
  } catch (err) {
    res.status(500).json({ msg: "Error al crear cupón", error: err.message });
  }
});

/* ── PUT /cupones/:id ────────────────────────────────────────── */
router.put("/:id", async (req, res) => {
  try {
    const { code, name, desc, type, value, dateFrom, dateTo,
            scope, minNights, maxUses, state } = req.body;

    if (!code || !name || !type || !dateFrom || !dateTo)
      return res.status(400).json({ msg: "Código, nombre, tipo y fechas son requeridos" });
    if (dateTo < dateFrom)
      return res.status(400).json({ msg: "La fecha de fin debe ser posterior al inicio" });

    // Verificar código duplicado en otro cupón
    const dup = await Cupon.findOne({ code: code.toUpperCase().trim(), _id: { $ne: req.params.id } });
    if (dup) return res.status(400).json({ msg: `El código ${code.toUpperCase()} ya pertenece a otro cupón` });

    const cupon = await Cupon.findByIdAndUpdate(
      req.params.id,
      {
        code:      code.toUpperCase().trim(),
        name, desc: desc || "",
        type,
        value:     type === "free" ? 1 : Number(value),
        dateFrom, dateTo,
        scope:     Array.isArray(scope) && scope.length ? scope : ["all"],
        minNights: minNights || 1,
        maxUses:   maxUses ? Number(maxUses) : null,
        state:     state || "active",
      },
      { new: true }
    );

    if (!cupon) return res.status(404).json({ msg: "Cupón no encontrado" });
    res.json({ msg: "Cupón actualizado", cupon });
  } catch (err) {
    res.status(500).json({ msg: "Error al actualizar cupón", error: err.message });
  }
});

/* ── PATCH /cupones/:id/estado — toggle activo/inactivo ──────── */
router.patch("/:id/estado", async (req, res) => {
  try {
    const cupon = await Cupon.findById(req.params.id);
    if (!cupon) return res.status(404).json({ msg: "Cupón no encontrado" });
    cupon.state = cupon.state === "active" ? "inactive" : "active";
    await cupon.save();
    res.json({ msg: "Estado actualizado", state: cupon.state, cupon });
  } catch (err) {
    res.status(500).json({ msg: "Error al cambiar estado", error: err.message });
  }
});

/* ── DELETE /cupones/:id ─────────────────────────────────────── */
router.delete("/:id", async (req, res) => {
  try {
    const cupon = await Cupon.findByIdAndDelete(req.params.id);
    if (!cupon) return res.status(404).json({ msg: "Cupón no encontrado" });
    res.json({ msg: "Cupón eliminado" });
  } catch (err) {
    res.status(500).json({ msg: "Error al eliminar cupón", error: err.message });
  }
});

module.exports = router;
