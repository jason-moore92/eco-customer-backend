const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const DeliveryPartnerSchema = new Schema(
  {
    enabled: { type: Boolean, defalut: false },
    name: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    website: { type: String, defalut: "" },
    servicingAreas: { type: Array, default: [] },
    charges: { type: Array, default: [] },
  },
  {
    versionKey: false,
    timestamps: true
  }
);

DeliveryPartnerSchema.pre('save', async function(next) {
  let product = this;
  return next();
});

DeliveryPartnerSchema.plugin(aggregatePaginate);


module.exports = mongoose.model('deliverypartners', DeliveryPartnerSchema);
