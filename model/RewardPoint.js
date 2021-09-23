const mongoose = require('mongoose')
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const Schema = mongoose.Schema
const RewardPointsSchema = new mongoose.Schema(
  {
    storeId: { type: String, required: true },
    buy: {
      rewardPoints: { type: Number, required: true },
      value: { type: Number, required: true },
    },
    redeem: {
      rewardPoints: { type: Number, required: true },
      value: { type: Number, required: true },
    },
    validity: {
      startDate: { type: Date, required: true },
      endDate: { type: Date }
    },
    minOrderAmount: { type: Number, required: true },
    maxRewardsPerOrder: { type: Number, required: true }
  },
  {
    versionKey: false,
    timestamps: true
  }
)
RewardPointsSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('rewardpoints', RewardPointsSchema)
