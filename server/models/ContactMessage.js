const mongoose = require("mongoose")

// Stores contact-form submissions so the site owner has a durable record
// (the form previously only emailed the submitter and saved nothing).
const contactMessageSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String },
  countrycode: { type: String },
  phoneNo: { type: String },
  message: { type: String },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("ContactMessage", contactMessageSchema)
