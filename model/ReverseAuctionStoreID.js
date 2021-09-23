const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const ReverseAuctionStoreIDSchema = new Schema(
  {
    reverseAuctionId: { type: String, required: true },
    storeId: { type: String, required: true },
    offerPrice: { type: String},
    message: { type: String },
    history: { type: Array, default: [] },
  },
  {
    versionKey: false,
    timestamps: true
  }
);

ReverseAuctionStoreIDSchema.pre('save', async function (next) {
  let product = this;
  return next();
});

ReverseAuctionStoreIDSchema.plugin(aggregatePaginate);


module.exports = mongoose.model('reverse_auction_stores', ReverseAuctionStoreIDSchema);
