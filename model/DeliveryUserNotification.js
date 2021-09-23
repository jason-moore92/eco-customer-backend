const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const DeliveryUserNotificationSchema = new Schema(
  {
    deliveryUserId: { type: String },
    storeId: { type: String },
    type: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed },
    title: { type: String, default: "" },
    body: { type: String, default: "" },
  },
  {
    timestamps: true
  }
);

DeliveryUserNotificationSchema.pre('save', async function (next) {
  let product = this;
  return next();
});

DeliveryUserNotificationSchema.plugin(aggregatePaginate);


module.exports = mongoose.model('delivery-user-notifications', DeliveryUserNotificationSchema);
