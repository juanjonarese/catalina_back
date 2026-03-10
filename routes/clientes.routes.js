const express = require("express");
const router  = express.Router();
const Cliente      = require("../models/clientes.model");
const PagoCliente  = require("../models/pagosClientes.model");
const Reserva      = require("../models/reservas.model");

/* ── GET /clientes — lista enriquecida ──────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const clientes = await Cliente.find().sort({ createdAt: -1 }).lean();
    const hoy = new Date(); hoy.setHours(0,0,0,0);

    const enriquecidos = await Promise.all(clientes.map(async (c) => {
      const reservas = await Reserva.find({ emailCliente: new RegExp(`^${c.email}$`, "i") })
        .populate("habitacionId", "nombre numero tipo")
        .lean();

      const pagos = await PagoCliente.find({ clienteId: c._id }).sort({ date: -1 }).lean();

      const totalDue = reservas
        .filter(r => r.estado !== "cancelada")
        .reduce((s, r) => s + r.precioTotal, 0);
      const totalPaid = pagos.reduce((s, p) => s + p.amount, 0);
      const deuda = Math.max(0, totalDue - totalPaid);

      const inhouse = reservas.some(r => {
        if (r.estado !== "confirmada") return false;
        const ci = new Date(r.fechaCheckIn);  ci.setHours(0,0,0,0);
        const co = new Date(r.fechaCheckOut); co.setHours(0,0,0,0);
        return ci <= hoy && co > hoy;
      });

      return { ...c, reservas, pagos, totalPaid, deuda, inhouse };
    }));

    res.json({ clientes: enriquecidos });
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener clientes", error: err.message });
  }
});

/* ── POST /clientes — crear ─────────────────────────────────────── */
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dni, dob, nationality,
            address, city, province, notes, vip } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ msg: "Nombre, apellido y email son requeridos" });
    }

    const existe = await Cliente.findOne({ email: email.toLowerCase() });
    if (existe) return res.status(400).json({ msg: "Ya existe un cliente con ese email" });

    const cliente = await Cliente.create({
      firstName, lastName, email, phone, dni, dob,
      nationality, address, city, province, notes,
      vip: vip === true || vip === "vip",
    });

    res.status(201).json({ msg: "Cliente creado", cliente });
  } catch (err) {
    res.status(500).json({ msg: "Error al crear cliente", error: err.message });
  }
});

/* ── PUT /clientes/:id — actualizar ─────────────────────────────── */
router.put("/:id", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dni, dob, nationality,
            address, city, province, notes, vip } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ msg: "Nombre, apellido y email son requeridos" });
    }

    // Verificar email duplicado en otro cliente
    const dup = await Cliente.findOne({ email: email.toLowerCase(), _id: { $ne: req.params.id } });
    if (dup) return res.status(400).json({ msg: "Ese email ya pertenece a otro cliente" });

    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, phone, dni, dob,
        nationality, address, city, province, notes,
        vip: vip === true || vip === "vip" },
      { new: true }
    );
    if (!cliente) return res.status(404).json({ msg: "Cliente no encontrado" });

    res.json({ msg: "Cliente actualizado", cliente });
  } catch (err) {
    res.status(500).json({ msg: "Error al actualizar cliente", error: err.message });
  }
});

/* ── DELETE /clientes/:id — eliminar (cascade pagos) ───────────── */
router.delete("/:id", async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndDelete(req.params.id);
    if (!cliente) return res.status(404).json({ msg: "Cliente no encontrado" });
    await PagoCliente.deleteMany({ clienteId: req.params.id });
    res.json({ msg: "Cliente eliminado" });
  } catch (err) {
    res.status(500).json({ msg: "Error al eliminar cliente", error: err.message });
  }
});

/* ── POST /clientes/:id/pagos — registrar pago ──────────────────── */
router.post("/:id/pagos", async (req, res) => {
  try {
    const { reservaId, method, amount, date, reference, notes } = req.body;

    if (!method || !amount || !date) {
      return res.status(400).json({ msg: "Método, monto y fecha son requeridos" });
    }
    if (amount <= 0) return res.status(400).json({ msg: "El monto debe ser mayor a 0" });

    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) return res.status(404).json({ msg: "Cliente no encontrado" });

    const pago = await PagoCliente.create({
      clienteId: req.params.id,
      reservaId: reservaId || null,
      method, amount: Number(Number(amount).toFixed(2)),
      date: new Date(date),
      reference: reference || "",
      notes: notes || "",
    });

    res.status(201).json({ msg: "Pago registrado", pago });
  } catch (err) {
    res.status(500).json({ msg: "Error al registrar pago", error: err.message });
  }
});

module.exports = router;
