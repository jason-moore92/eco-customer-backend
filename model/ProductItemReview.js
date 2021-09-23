const mongoose = require('mongoose')
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const Schema = mongoose.Schema
const ProductItemReviewSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true },
    userId: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    review: { type: String, required: true },
    rating: { type: Number, default: 0 },
    approve: { type: Boolean, default: false }
  },
  {
    versionKey: false,
    timestamps: true
  }
)
ProductItemReviewSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('product_item_reviews', ProductItemReviewSchema)
