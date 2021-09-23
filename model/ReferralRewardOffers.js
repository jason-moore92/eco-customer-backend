const mongoose = require('mongoose')
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const Schema = mongoose.Schema


const ReferralRewardOffersSchema = new mongoose.Schema(
  {
    referredByUserId: { type: String, required: true },
    referralUserId: { type: String, required: true },
    status: { type: String, required: true },
    rulesId: { type: String, required: true },
    referralOfferType: { type: String, required: true },
    appliedFor: { type: String, required: true },
    referredByUserRewardPoints: { type: Number, required: true },
    referralUserRewardPoints: { type: Number, required: true },
    referredByUserAmount: { type: Number, required: true },
    referralUserAmount: { type: Number, required: true },
    minimumFirstOrder: { type: Number },
    maximumorder: { type: Number },
    isReferralUserRegistred: { type: Boolean, default: false },
    isReferralLoggedIn: { type: Boolean, default: false },
    isReferralMadeFirstOrder: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    timestamps: true
  }
)
ReferralRewardOffersSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('referral_reward_offers', ReferralRewardOffersSchema)
