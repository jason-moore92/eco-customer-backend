const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const DeliveryUserSchema = new Schema({
  imageUrl: { type: String, default: "" },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true ,unique: true},
  mobile: { type: String  ,unique: true },
  password: { type: String, required: true, select: true },
  verified: { type: Boolean, default: false },
  enabled: { type: Boolean, default: false },
  otp: { type: String, default: "" },
  otpExpires: { type: Date },
  deliveryPartnerIds: { type: Array, default: [] },
  status: [
    {
      fcmToken: { type: String, required: true },
      status: { type: String, required: true },
      jwtToken: { type: String, default: "" },
    }
  ],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

DeliveryUserSchema.pre('save', async function(next) {
  let DeliveryUser = this;
  if (!DeliveryUser.isModified('password')) return next();

  DeliveryUser.password = await bcrypt.hash(DeliveryUser.password, 10);
  return next();
});

module.exports = mongoose.model('delivery-users', DeliveryUserSchema);
