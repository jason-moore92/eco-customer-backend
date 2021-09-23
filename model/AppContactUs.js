const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const ContactSchema = new Schema({
  category: { type: String, required: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ["Open", "Closed"],
    required: true,
    default: "Open"
  },
  priority: { type: String, defalt:"" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ContactSchema.pre('save', async function (next) {
  let Contact = this;
  return next();
});

module.exports = mongoose.model('app_contact_us_requests', ContactSchema);
