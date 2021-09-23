const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const PromocodeSchema = new Schema(
  {
    promocodeType: { type: String, required: true },
    images: { type: Array, default: [] },
    loadedImages: { type: Array, default: [] },
    name: { type: String, required: true },
    promocodeCode: { type: String, required: true },
    description: { type: String, default: "" },
    promocodeValue: { type: String, required: true },
    noOfTimesAppliedByUser: { type: Number},
    validityStartDate: { type: Date, default: Date.now },
    validityEndDate: { type: Date, default: Date.now },
    termscondition: { type: String, default: "" },
    minimumorder: { type: String  },
    maximumDiscount: { type: String },
    categoriesAppliedFor: { type: Array, default: [] },
    userIds: { type: Array, default: [] },
  },
  {
    timestamps: true
  }
);

PromocodeSchema.pre('save', async function (next) {
  let product = this;
  return next();
});

PromocodeSchema.plugin(aggregatePaginate);


module.exports = mongoose.model('promocode', PromocodeSchema);
