const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RestaurantSchema = new Schema({
  product_id: { type: String, required: true },
  user_id: { type: String,  required: true   },
  quantity: { type: Number ,  default: 1 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

RestaurantSchema.pre('save', async function(next) {
  let Restaurant = this;
  return next();
});

module.exports = mongoose.model('carts', RestaurantSchema);
