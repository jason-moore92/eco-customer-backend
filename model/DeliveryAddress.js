const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const DeliveryAddressSchema = new Schema(
  {
    userId: { type: String, required: true },
    address: { type: mongoose.Schema.Types.Mixed },
    addressType: { type: String, required: true },
    building: { type: String, default: "" },
    howToReach: { type: String, default: "" },
    contactPhone: { type: String, required: true },
  },
  {
    timestamps: true
  }
);

DeliveryAddressSchema.pre('save', async function (next) {
  let product = this;
  return next();
});

DeliveryAddressSchema.plugin(aggregatePaginate);


module.exports = mongoose.model('deliveryaddresses', DeliveryAddressSchema);
