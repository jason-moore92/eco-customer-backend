const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const bcrypt = require('bcrypt');
const bcrypt = require('bcryptjs');

const AppUserSchema = new Schema({
  imageUrl: { type: String, default: "" },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true ,unique: true},
  mobile: { type: String  ,default:"" },
  password: { type: String, required: true, select: false },
  // verification: { type: String, default: "" },
  referralCode: { type: String, default: "" },
  referredBy: { type: String, default: "" },
  isNotifiable: { type: Boolean, default: true },
  verified: { type: Boolean, default: false }, //Note:: Email verified
  enabled: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  role: { type: String, required: true },
  extraRoles: { type: Array, default: [] },
  loginAttempts: { type: Number, default: 0 },
  registeredVia: { type: String, default: "" },

  //Note:: below are for forget pswd -> otp -> update password flow
  otp: { type: String, default: "", select: false },
  otpExpires: { type: Date },

  //Note:: below are for register -> email -> click link consist of token -> email verified.
  emailVerifyToken: { type: String, default: "", select: false },
  emailVerifyTokenExpires: { type: Date },

  //Note:: below are for mobile verification (with / wo authentication)
  mobileVerifyToken: { type: String, default: "", select: false },
  mobileVerifyTokenExpires: { type: Date },

  status: [
    {
      fcmToken: { type: String, required: true },
      status: { type: String, required: true },
      jwtToken: { type: String, default: "" },
    }
  ],
  freshChat: {
    restoreId: { type: String, required: false}
  },
  community: {
    id: {type: String, required: false}
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  
});

AppUserSchema.pre('save', async function(next) {
  let appUser = this;
  if (!appUser.isModified('password')) return next();

  // appUser.password = await bcrypt.hash(appUser.password, 10);
  appUser.password = bcrypt.hashSync(appUser.password, 10);
  
  return next();
});

module.exports = mongoose.model('app-users', AppUserSchema);
