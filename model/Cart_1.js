const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const CartSchema = new Schema(
  {
    userId: { type: String, required: true },
    storeId: { type: String, required: true },
    category: { type: String, required: true },
    productId: { type: String, required: true },
    quantity: { type: Number, default: 1 },
  },
  {
    timestamps: true
  }
);

CartSchema.pre('save', async function(next) {
  let product = this;
  return next();
});

CartSchema.plugin(aggregatePaginate);


module.exports = mongoose.model('carts', CartSchema);
