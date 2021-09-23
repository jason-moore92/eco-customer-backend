const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const FavoriteSchema = new Schema(
  {
    storeId: { type: String, required: true },
    userId: { type: String, required: true },
    id: { type: String, required: true },
    category: { type: String, required: true },
    lastDeviceToken: { type: String, default: "" },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    isFavorite: { type: Boolean, defalut: true },
  },
  {
    timestamps: true
  }
);

FavoriteSchema.pre('save', async function(next) {
  let product = this;
  return next();
});

FavoriteSchema.plugin(aggregatePaginate);


module.exports = mongoose.model('favorites', FavoriteSchema);
