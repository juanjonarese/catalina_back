require("dotenv").config();
require("./db/config.database");

const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");

// Configuración de CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
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

try {
  const pasajerosRoutes = require("./routes/pasajeros.routes");
  app.use("/pasajeros", pasajerosRoutes);
  console.log("✓ Rutas de pasajeros cargadas");
} catch (error) {
  console.error("✗ Error al cargar rutas de pasajeros:", error.message);
}

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ msg: "API Hotel funcionando correctamente" });
});

// Ruta de prueba directa para habitaciones
app.get("/test-habitaciones", (req, res) => {
  res.json({ msg: "Ruta de test funcionando" });
});

// Solo iniciar el servidor si no estamos en Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Servidor funcionando en puerto ${PORT}`);
    console.log("Rutas disponibles:");
    console.log("  GET  /");
    console.log("  GET  /habitaciones");
    console.log("  POST /habitaciones");
    console.log("  GET  /reservas");
    console.log("  POST /reservas");
    console.log("  GET  /pasajeros");
    console.log("  POST /pasajeros");
  });
}

// Exportar la app para Vercel
module.exports = app;
