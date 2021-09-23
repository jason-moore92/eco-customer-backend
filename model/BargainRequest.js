const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const BargainRequestSchema = new Schema(
  {
    categoryId: { type: String, required: true },
    storeId: { type: String, required: true },
    userId: { type: String, required: true },
    bargainRequestId: { type: String, required: true },
    products: { type: Array, default: [] },
    services: { type: Array, default: [] },
    isBulkOrder: { type: Boolean, default: false },
    offerPrice: { type: String, required: true },
    userOfferPriceList: { type: Array, default: [] },
    storeOfferPriceList: { type: Array, default: [] },
    status: { type: String, required: true },
    subStatus: { type: String },
    messages: { type: Array, default: [] },
    history: { type: Array, default: [] },
    bargainDateTime: { type: Date, required: true },
    isEnabled: { type: Boolean, required: false },
  },
  {
    versionKey: false,
    timestamps: true
  }
);

BargainRequestSchema.pre('save', async function (next) {
  let product = this;
  return next();
});

BargainRequestSchema.plugin(aggregatePaginate);


module.exports = mongoose.model('bargain_requests', BargainRequestSchema);
