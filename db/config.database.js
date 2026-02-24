const mongoose = require("mongoose");

// Cache de conexión para Vercel serverless
// Vercel reutiliza instancias calientes, pero cada cold start necesita reconectar
let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_CONNECT)
      .then((m) => {
        console.log("Base de datos conectada exitosamente");
        return m;
      })
      .catch((error) => {
        cached.promise = null;
        console.error("Error al conectar la base de datos:", error.message);
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
