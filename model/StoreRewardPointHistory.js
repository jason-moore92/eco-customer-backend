const mongoose = require('mongoose')
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const Schema = mongoose.Schema
const StoreRewardPointsHistorySchema = new mongoose.Schema(
  {
    sendStoreId: { type: String, required: true },
    receiveStoreId: { type: String, required: true },
    rewardPoints: { type: Number, required: true },
    history: { type: Array, default: [] },
  },
  {
    versionKey: false,
    timestamps: true
  }
)
StoreRewardPointsHistorySchema.plugin(aggregatePaginate);

module.exports = mongoose.model('store_rewardpoints_allocation_redemptions', StoreRewardPointsHistorySchema)
