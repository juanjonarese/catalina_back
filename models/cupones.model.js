const { Schema, model } = require("mongoose");

const CuponSchema = new Schema({
  code:        { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:        { type: String, required: true, trim: true },
  desc:        { type: String, default: "" },
  type:        { type: String, enum: ["pct", "flat", "free"], required: true },
  value:       { type: Number, default: 0, min: 0 },   // pct → %, flat → $, free → 1
  dateFrom:    { type: String, required: true },         // YYYY-MM-DD
  dateTo:      { type: String, required: true },         // YYYY-MM-DD
  scope:       { type: [String], default: ["all"] },     // ['all'] | ['Suite','Premium',...]
  minNights:   { type: Number, default: 1, min: 1 },
  maxUses:     { type: Number, default: null },           // null = sin límite
  usedCount:   { type: Number, default: 0 },
  savedAmount: { type: Number, default: 0 },
  state:       { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = model("cupones", CuponSchema);
