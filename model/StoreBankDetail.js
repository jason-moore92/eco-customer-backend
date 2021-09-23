const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const bcrypt = require('bcrypt');
const bcrypt = require('bcryptjs');

const StoreBankDetailSchema = new Schema(
  {
    storeId: { type: String, required: true },
    accountNumber: { type: String, default: "" },
    routingNumber: { type: String, default: "" },
    qrcodeImageUrl: { type: String, default: "" },
    vpaDetail: { type: String, default: "" },
  },
  {
    versionKey: false,
    timestamps: true
  }
);

StoreBankDetailSchema.pre('save', async function(next) {
  let storeBankDetail = this;
  if (!storeBankDetail.isModified('password')) return next();

  // storeBankDetail.password = await bcrypt.hash(storeBankDetail.password, 10);
  storeBankDetail.password = bcrypt.hashSync(storeBankDetail.password, 10);
  
  return next();
});

module.exports = mongoose.model('store-bank-detail', StoreBankDetailSchema);
