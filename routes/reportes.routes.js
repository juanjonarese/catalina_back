const express    = require("express");
const router     = express.Router();
const Reserva    = require("../models/reservas.model");
const Habitacion = require("../models/habitaciones.model");

/* ── Calcula rango de fechas a partir del período ──────────────── */
function getPeriodRange(periodo) {
  const now = new Date();
  const y   = now.getFullYear();
  const m   = now.getMonth();
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (yr, mo, dy) => `${yr}-${pad(mo + 1)}-${pad(dy)}`;

  switch (periodo) {
    case "thisMonth": {
      const days = new Date(y, m + 1, 0).getDate();
      return { from: iso(y, m, 1), to: iso(y, m, days) };
    }
    case "lastMonth": {
      const lm = m === 0 ? 11 : m - 1;
      const ly = m === 0 ? y - 1 : y;
      const days = new Date(ly, lm + 1, 0).getDate();
      return { from: iso(ly, lm, 1), to: iso(ly, lm, days) };
    }
    case "last3": {
      const d    = new Date(y, m - 2, 1);
      const days = new Date(y, m + 1, 0).getDate();
      return { from: iso(d.getFullYear(), d.getMonth(), 1), to: iso(y, m, days) };
    }
    case "thisYear": {
      return { from: `${y}-01-01`, to: iso(y, 11, 31) };
    }
    case "allTime": {
      return { from: "2000-01-01", to: "2099-12-31" };
    }
    default: { // last6
      const d    = new Date(y, m - 5, 1);
      const days = new Date(y, m + 1, 0).getDate();
      return { from: iso(d.getFullYear(), d.getMonth(), 1), to: iso(y, m, days) };
    }
  }
}

/* ── GET /reportes?periodo=last6 ──────────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const periodo  = req.query.periodo || "last6";
    const range    = getPeriodRange(periodo);

    // Período anterior equivalente (para delta de KPIs)
    const span     = Math.round((new Date(range.to) - new Date(range.from)) / 86400000) + 1;
    const prevTo   = new Date(range.from); prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo);     prevFrom.setDate(prevFrom.getDate() - span + 1);
    const prevRange = {
      from: prevFrom.toISOString().split("T")[0],
      to:   prevTo.toISOString().split("T")[0],
    };

    const [reservas, prevReservas, habitaciones] = await Promise.all([
      Reserva.find({ fechaCheckIn: { $gte: range.from, $lte: range.to } })
        .populate("habitacionId", "titulo numero precio")
        .lean(),
      Reserva.find({ fechaCheckIn: { $gte: prevRange.from, $lte: prevRange.to } })
        .populate("habitacionId", "titulo numero precio")
        .lean(),
      Habitacion.find({ disponible: true }).sort({ numero: 1 }).lean(),
    ]);

    res.json({ reservas, prevReservas, habitaciones, range, prevRange });
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener reportes", error: err.message });
  }
});

module.exports = router;
