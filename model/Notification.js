const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const NotificationSchema = new Schema(
  {
    userId: { type: String },
    storeId: { type: String },
    type: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed },
    title: { type: String, default: "" },
    body: { type: String, default: "" },
  },
  {
    timestamps: true
  }
);

NotificationSchema.pre('save', async function (next) {
  let product = this;
  return next();
});

NotificationSchema.plugin(aggregatePaginate);


module.exports = mongoose.model('app-notifications', NotificationSchema);
