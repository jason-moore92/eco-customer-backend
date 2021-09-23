const mongoose = require('mongoose')
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const Schema = mongoose.Schema
const ReferralRewardOfferTypeRulesSchema = new mongoose.Schema(
  {
    referralOfferType: { type: String, required: true },
    referredByUserRewardPoints: { type: Number, required: true },
    referredByUserAmount: { type: Number, required: true },
    referralUserRewardPoints: { type: Number, required: true },
    referralUserAmount: { type: Number, required: true },
    loadedImages: { type: Array, default: [] },
    Step1Text: { type: String, required: true },
    Step2Text: { type: String, required: true },
    Step3Text: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    validityStartDate: { type: Date, required: true },
    validityEndDate: { type: Date, required: true },
    termscondition: { type: String, required: true },
    activeReferralOffer: { type: Boolean, default: false },
    minimumFirstOrder: { type: Number },
    maximumorder: { type: Number },
    appliedFor: { type: String, required: true },
  },
  {
    versionKey: false,
    timestamps: true
  }
)
ReferralRewardOfferTypeRulesSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('referral_reward_offer_type_rules', ReferralRewardOfferTypeRulesSchema)
