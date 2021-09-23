const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const ScratchCardValues = new Schema(
  {
    scratchCardConfigId: { type: String, required: true },
    amount: {type: Number, required: true, default : 0},
    used: {type: Boolean, default: false}
  },
  {
    timestamps: true,
    versionKey: false
  }
);

//TODO:: move this to mongoose helpers
ScratchCardValues.statics.bulkInsert = async function(models) {

  return new Promise(
    (resolve, reject) => {
      if (!models || !models.length){
        resolve(null)
      }
      
      var bulk = this.collection.initializeOrderedBulkOp();
      if (!bulk)
        return reject('bulkInsertModels: MongoDb connection is not yet established');
    
      var model;
      for (var i=0; i<models.length; i++) {
        model = models[i];
        bulk.insert(model);
      }
    
      bulk.execute(resolve);  
    }
  );
};

ScratchCardValues.plugin(aggregatePaginate);


module.exports = mongoose.model('scratch_card_values', ScratchCardValues);
