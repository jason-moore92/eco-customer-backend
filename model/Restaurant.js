const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RestaurantSchema = new Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  address: { type: String  },
  latitude: { type: Number  },
  longitude: { type: Number  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

RestaurantSchema.pre('save', async function(next) {
  let Restaurant = this;
  return next();
});

module.exports = mongoose.model('restaurants', RestaurantSchema);
