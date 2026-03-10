require("dotenv").config();
const connectDB = require("./db/config.database");

const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");

// Configuración de CORS
const origenesPermitidos = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, curl, server-to-server)
    if (!origin || origenesPermitidos.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqueado para origin: ${origin}`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(morgan("dev"));

// Middleware de conexión a DB — garantiza que cada request espera la conexión
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503).json({ msg: "Error de conexión a la base de datos", error: error.message });
  }
});

// Rutas
try {
  const reservasRoutes = require("./routes/reservas.routes");
  app.use("/reservas", reservasRoutes);
} catch (error) {
  console.error("✗ Error al cargar rutas de reservas:", error.message);
}

try {
  const habitacionesRoutes = require("./routes/habitaciones.routes");
  app.use("/habitaciones", habitacionesRoutes);
} catch (error) {
  console.error("✗ Error al cargar rutas de habitaciones:", error.message);
}

try {
  const pasajerosRoutes = require("./routes/pasajeros.routes");
  app.use("/pasajeros", pasajerosRoutes);
} catch (error) {
  console.error("✗ Error al cargar rutas de pasajeros:", error.message);
}

try {
  const pagosRoutes = require("./routes/pagos.routes");
  app.use("/pagos", pagosRoutes);
} catch (error) {
  console.error("✗ Error al cargar rutas de pagos:", error.message);
}

try {
  const authRoutes = require("./routes/auth.routes");
  app.use("/auth", authRoutes);
} catch (error) {
  console.error("✗ Error al cargar rutas de auth:", error.message);
}

try {
  const clientesRoutes = require("./routes/clientes.routes");
  app.use("/clientes", clientesRoutes);
} catch (error) {
  console.error("✗ Error al cargar rutas de clientes:", error.message);
}

try {
  const temporadasRoutes = require("./routes/temporadas.routes");
  app.use("/temporadas", temporadasRoutes);
} catch (error) {
  console.error("✗ Error al cargar rutas de temporadas:", error.message);
}

try {
  const cuponesRoutes = require("./routes/cupones.routes");
  app.use("/cupones", cuponesRoutes);
} catch (error) {
  console.error("✗ Error al cargar rutas de cupones:", error.message);
}

try {
  const reportesRoutes = require("./routes/reportes.routes");
  app.use("/reportes", reportesRoutes);
} catch (error) {
  console.error("✗ Error al cargar rutas de reportes:", error.message);
}

// Ruta de health check
app.get("/", (req, res) => {
  res.json({ msg: "API Hotel funcionando correctamente" });
});

// Solo iniciar el servidor si no estamos en Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Servidor funcionando en puerto ${PORT}`);
  });
}

// Exportar la app para Vercel
module.exports = app;
