const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const CartSchema = new Schema(
  {
    userId: { type: String, required: true },
    storeId: { type: String, required: true },
    status: { type: String, default: "" },
    lastDeviceToken: { type: String, default: "" },
    products: [
      {
        orderQuantity: { type: Number, default: 1 },
        id: { type: mongoose.Schema.ObjectId, required: true },
      }
    ],
    services: [
      {
        orderQuantity: { type: Number, default: 1 },
        id: { type: mongoose.Schema.ObjectId, required: true },
      }
    ],
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  // {
  //   timestamps: true
  // }
);

CartSchema.pre('save', async function(next) {
  let product = this;
  return next();
});

CartSchema.plugin(aggregatePaginate);


module.exports = mongoose.model('carts', CartSchema);
