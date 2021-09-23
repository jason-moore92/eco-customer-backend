const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const OrderSchema = new Schema(
  {
    orderId: { type: String, required: true },
    invoiceId: { type: String, required: true },
    userId: { type: String, required: true },
    storeId: { type: String, required: true },
    category: { type: String, required: true },
    orderType: { type: String, required: true },
    status: { type: String, required: true },
    qrcodeImgUrl: { type: String, required: true },
    invoicePdfUrl: { type: String, required: true },
    invoicePdfUrlForStore: { type: String, required: true },
    instructions: { type: String, default: "" },
    products: { type: Array, default: [] },
    services: { type: Array, default: [] },
    bogoProducts: { type: Array, default: [] },
    bogoServices: { type: Array, default: [] },
    promocode: { type: mongoose.Schema.Types.Mixed },
    storeCategoryId: { type: String, required: true },
    storeCategoryDesc: { type: String, required: true },
    storeLocation: {
      type: { type: String },
      coordinates: [Number]
    },
    completeDateTime: { type: Date },
    serviceDateTime: { type: Date },
    // Pickup data
    pickupDateTime: { type: Date },
    payAtStore: { type: Boolean, default: false },
    // delivery data
    cashOnDelivery: { type: Boolean, default: false },
    noContactDelivery: { type: Boolean, default: true },
    deliveryAddress: { type: mongoose.Schema.Types.Mixed },
    deliveryPartnerDetails: { type: mongoose.Schema.Types.Mixed },
    deliveryDetail: { type: mongoose.Schema.Types.Mixed },
    ///
    rewardPointData: { type: mongoose.Schema.Types.Mixed },
    rewardPointsEarnedPerOrder: { type: Number, default: 0 },
    redeemRewardData: { type: mongoose.Schema.Types.Mixed },
    /////////////////////////////
    pickupDeliverySatus: { type: Boolean, default: false },
    payStatus: { type: Boolean, default: false },
    paymentApiData: { type: mongoose.Schema.Types.Mixed },
    scratchCardId: { type: String, required: false },
    reasonForCancelOrReject: { type: String, default: "" },
    /////////////////////////////
    paymentDetail: { type: mongoose.Schema.Types.Mixed },
    /// invoice data
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
