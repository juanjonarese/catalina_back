const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_CONNECT)
  .then(() => console.log("Base de datos conectada exitosamente"))
  .catch((error) => console.log("Error al conectar la base de datos:", error));
