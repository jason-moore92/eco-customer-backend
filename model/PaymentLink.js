const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const PaymentLinkSchema = new Schema(
  {
    paymentData:{
      id: { type: String, required: true },
      amount: { type: Number, required: true },
      currency: { type: String },
      reminder_enable: { type: Boolean },
      accept_partial: { type: Boolean },
      first_min_partial_amount: { type: Number },
      description: { type: String },
      reference_id: { type: String },
      customer: { type: mongoose.Schema.Types.Mixed },
      expire_by: { type: Number },
      notify: { type: mongoose.Schema.Types.Mixed },
      notes: { type: mongoose.Schema.Types.Mixed },
      callback_url: { type: String },
      callback_method: { type: String },
      amount_paid: { type: Number },
      cancelled_at: { type: Number },
      created_at: { type: Number },
      updated_at: { type: Number },
      expired_at: { type: Number },
      payments: { type: Array, default: [] },
      reminders: { type: Array, default: [] },
      short_url: { type: String },
      status: { type: String },
      upi_link: { type: Boolean },
      user_id: { type: String },
    },
    storeId: { type: String, required: true },
    userId: { type: String, required: true },
    products: { type: Array, default: [] },
    services: { type: Array, default: [] },
  },
  {
    timestamps: true
  }
);

PaymentLinkSchema.pre('save', async function (next) {
  let product = this;
  return next();
});

PaymentLinkSchema.plugin(aggregatePaginate);


module.exports = mongoose.model('payement_links', PaymentLinkSchema);
