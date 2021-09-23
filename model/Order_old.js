const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const OrderSchema = new Schema(
  {
    orderId: { type: String, required: true },
    qrcodeImgUrl: { type: String, required: true },
    invoicePdfUrl: { type: String, required: true },
    invoicePdfUrlForStore: { type: String, required: true },
    userId: { type: String, required: true },
    storeId: { type: String, required: true },
    category: { type: String, required: true },
    storeCategoryId: { type: String, required: true },
    storeCategoryDesc: { type: String, required: true },
    products: { type: Array, default: [] },
    services: { type: Array, default: [] },
    storeLocation: {
      type: { type: String },
      coordinates: [Number]
    },
    instructions: { type: String, default: "" },
    promocode: { type: mongoose.Schema.Types.Mixed },
    orderType: { type: String, required: true },
    completeDateTime: {type:Date},
    pickupDateTime: { type: Date },
    deliveryAddress: { type: mongoose.Schema.Types.Mixed },
    noContactDelivery: { type: Boolean, default: true },
    serviceDateTime: { type: Date },
    paymentDetail: { type: mongoose.Schema.Types.Mixed },
    rewardPointData: { type: mongoose.Schema.Types.Mixed },
    rewardPointsEarnedPerOrder: { type: Number, default: 0 },
    deliveryPartnerDetails: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, required: true },
    paymentApiData: { type: mongoose.Schema.Types.Mixed },
    payAtStore: { type: Boolean, default: false },
    cashOnDelivery: { type: Boolean, default: false },
    payStatus: { type: Boolean, default: false },
    pickupDeliverySatus: { type: Boolean, default: false },
    deliveryDetail: { type: mongoose.Schema.Types.Mixed },
    redeemRewardData: { type: mongoose.Schema.Types.Mixed },
    scratchCardId: {type: String, required: false},
    reasonForCancelOrReject: { type: String, default:"" },
    paymentFor: { type: String, },
    notes: {
      title:  { type: String, },
      description: { type: String, },
    },
    dueDate: { type: Date },
    initiatedBy: { type: String, default: "User" },
    coupon: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true
  }
);

OrderSchema.pre('save', async function (next) {
  let product = this;
  return next();
});

OrderSchema.index({ storeLocation: '2dsphere' });

OrderSchema.plugin(aggregatePaginate);


module.exports = mongoose.model('orders', OrderSchema);
