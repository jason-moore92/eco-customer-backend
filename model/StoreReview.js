const mongoose = require('mongoose')
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const Schema = mongoose.Schema
const StoreReviewSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    storeId: { type: String, required: true },
    title: { type: String, required: true },
    review: { type: String, required: true },
    rating: { type: Number, default: 0 },
  },
  {
    versionKey: false,
    timestamps: true
  }
)
StoreReviewSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('store_reviews', StoreReviewSchema)
