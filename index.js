require("dotenv").config();
require("./db/config.database");

const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));

// Rutas
console.log("Cargando rutas...");
try {
  const reservasRoutes = require("./routes/reservas.routes");
  app.use("/reservas", reservasRoutes);
  console.log("✓ Rutas de reservas cargadas");
} catch (error) {
  console.error("✗ Error al cargar rutas de reservas:", error.message);
}

try {
  const habitacionesRoutes = require("./routes/habitaciones.routes");
  app.use("/habitaciones", habitacionesRoutes);
  console.log("✓ Rutas de habitaciones cargadas");
} catch (error) {
  console.error("✗ Error al cargar rutas de habitaciones:", error.message);
}

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ msg: "API Hotel funcionando correctamente" });
});

// Ruta de prueba directa para habitaciones
app.get("/test-habitaciones", (req, res) => {
  res.json({ msg: "Ruta de test funcionando" });
});

app.listen(8080, () => {
  console.log("Servidor funcionando en puerto 8080");
  console.log("Rutas disponibles:");
  console.log("  GET  /");
  console.log("  GET  /habitaciones");
  console.log("  POST /habitaciones");
  console.log("  GET  /reservas");
  console.log("  POST /reservas");
});
