const mongoose = require('mongoose')
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const Schema = mongoose.Schema
const RewardPointsHistorySchema = new mongoose.Schema(
  {
    storeId: { type: String, required: true },
    userId: { type: String, required: true },
    rewardPoints: { type: Number, required: true },
    history: { type: Array, default: [] },
  },
  {
    versionKey: false,
    timestamps: true
  }
)
RewardPointsHistorySchema.plugin(aggregatePaginate);

module.exports = mongoose.model('rewardpoints_allocation_redemptions', RewardPointsHistorySchema)
