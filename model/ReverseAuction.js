const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const ReverseAuctionSchema = new Schema(
  {
    categoryId: { type: String, required: true },
    userId: { type: String, required: true },
    reverseAuctionId: { type: String, required: true },
    products: { type: Array, default: [] },
    services: { type: Array, default: [] },
    biddingPrice: { type: String, required: true },
    storeBiddingPriceList: { type: Schema.Types.Mixed, default: {} },
    acceptedStoreId: { type: String },
    status: { type: String, required: true },
    messages: { type: Array, default: [] },
    biddingStartDateTime: { type: Date, required: true },
    biddingEndDateTime: { type: Date, required: true },
    isEnabled: { type: Boolean, required: false },
  },
  {
    versionKey: false,
    timestamps: true
  }
);

ReverseAuctionSchema.pre('save', async function (next) {
  let product = this;
  return next();
});

ReverseAuctionSchema.plugin(aggregatePaginate);


module.exports = mongoose.model('reverse_auction_bids', ReverseAuctionSchema);
