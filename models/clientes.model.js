const { Schema, model } = require("mongoose");

const ClienteSchema = new Schema({
  firstName:   { type: String, required: true, trim: true },
  lastName:    { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:       { type: String, default: "" },
  dni:         { type: String, default: "" },
  dob:         { type: String, default: "" },      // YYYY-MM-DD
  nationality: { type: String, default: "" },
  address:     { type: String, default: "" },
  city:        { type: String, default: "" },
  province:    { type: String, default: "" },
  notes:       { type: String, default: "" },
  vip:         { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = model("clientes", ClienteSchema);
