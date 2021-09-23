const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const ScratchCardConfig = new Schema(
  {
    createdBy: { type: String, required: true },
    budget: {type: Number, required: true},
    distributions:  [
      {
        amount:  {type: Number, required: true}, //0 means betterluck next time
        percentage:  {type: Number, required: true}
      }
    ],
    zeroRate: {type: Number, required: true, default : 0},
    version: {type: String, required: true, default: "v1"},
    userLimit: {type: Number, required: false, default: 25, description: "limit the amounts alloted to unique user in a given day."}
  },
  {
    timestamps: true,
    versionKey: false
  }
);

ScratchCardConfig.pre('save', async function (next) {
  let scratchCardConfig = this;
  let percentages  = scratchCardConfig.distributions.map(d => d.percentage);
  let sum = percentages.reduce((acc,next) =>acc+next , 0)
  if(sum != 100){
    throw new Error("Distribution percentages should sum up to 100.")
  }
  return next();
});

ScratchCardConfig.plugin(aggregatePaginate);


module.exports = mongoose.model('scratch_card_config', ScratchCardConfig);
