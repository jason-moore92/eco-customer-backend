const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const ServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    provided: {
      type: String,
      required: true
    },
    storeId: {
      type: String,
      required: true
    },
    taxPercentage: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: true
    },
    isAvailable: {
      type: String,
      default: false
    },
    showPriceToUsers: {
      type: String,
      default: false
    },
    images: [{
      type: String,
      required: true
    }],
    bargainAvailable: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    discount: {
      type: Number
    },
    listonline: {
      type: Boolean
    },
    serviceIdentificationCode: {
      type: String,
      //  required: true
    },
    priceAttributes: {
      selling: {
        type: Number
      },
      buying: {
        type: Number
      }
    },
    margin: {
      type: Number
    },
    bargainAttributes: {
      minQuantity: {
        type: Number
      },
      minAmount: {
        type: Number
      }
    },
    extraCharges: {
      cess: {
        percentage: {
          type: Number
        },
        value: {
          type: Number
        }
      }
    },
    attributes: [
      {
        type: {
          type: String
        },
        value: {
          type: String
        },
        units: {
          type: String
        },
        specifiers: {
          type: String
        }
      }
    ]
  },
  {
    versionKey: false,
    timestamps: true
  }
)

ServiceSchema.pre('save', async function(next) {
  let product = this;
  return next();
});

ServiceSchema.plugin(aggregatePaginate);


module.exports = mongoose.model('services', ServiceSchema);
