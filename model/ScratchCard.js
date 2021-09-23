const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const ScratchCard = new Schema(
  {
    scratchCardConfigId: { type: String, required: true },
    scratchCardValueId: { type: String, required: false }, //TODO:: while updating it should be required how to mention it.
    userId: { type: String, required: true },
    orderId: { type: String, required: true },
    amount: {type: Number, required: false, default : 0, description: "In terms of original current INR"}, //TODO:: while updating it should be required how to mention it.
    status: {type: String, enum: ["scratched", "not_scratched"], default: "not_scratched"},
    amountInPoints: {type: Number, required: false, default: 0, description: "In terms of reward points"}
  },
  {
    timestamps: true,
    versionKey: false
  }
);

ScratchCard.plugin(aggregatePaginate);


module.exports = mongoose.model('scratch_cards', ScratchCard);
