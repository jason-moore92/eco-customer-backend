const mongoose = require('mongoose')

var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const Schema = mongoose.Schema
const CouponsSchema = new mongoose.Schema(
  {
    storeId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    discountCode: { type: String, required: true },
    discountType: { type: String, required: true },
    discountData: {
      discountValue: { type: String },
      discountMaxAmount: { type: String },
      customerBogo: {
        buy: {
          products: { type: Array, default: [] },
          services: { type: Array, default: [] },
          quantity: { type: String },
        },
        get: {
          products: { type: Array, default: [] },
          services: { type: Array, default: [] },
          quantity: { type: String },
          type: { type: String },
          percentValue: { type: Number }
        },
      },
    },
    appliedFor: { type: String, required: true },
    appliedData: {
      appliedCategories: {
        productCategories: { type: Array, default: [] },
        serviceCategories: { type: Array, default: [] },
      },
      appliedItems: {
        products: { type: Array, default: [] },
        services: { type: Array, default: [] },
      },
    },
    minimumRequirements: { type: String, required: true },
    minimumAmount: { type: Number, },
    minimumQuantity: { type: Number, },
    // customerEligibility: { type: String, required: true },
    eligibility: { type: String, required: true },
    specificCustomers: { type: Array, default: [] },
    usageLimits: { type: String, required: true },
    limitNumbers: { type: Number },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    terms: { type: String },
    images: { type: Array, default: [] },
    enabled: { type: Boolean, default: true },
  },
  {
    versionKey: false,
    timestamps: true
  }
)

CouponsSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('coupons', CouponsSchema)
