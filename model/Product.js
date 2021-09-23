const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');


const ProductSchema = new mongoose.Schema(
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
    brand: {
      type: String
    },
    quantity: {
      type: String
    },
    quantityType: {
      type: String
    },
    storeId: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    isAvailable: {
      type: String,
      default: false
    },
    racklocation: {
      type: String
    },
    stockavailable: {
      type: Number,
      required: true
    },

    taxPercentage: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    showPriceToUsers: {
      type: String,
      default: false
    },
    productIdentificationCode: {
      type: String
    },
    images: [{
      type: String,
      required: true
    }],
    bargainAvailable: {
      type: Boolean,
      default: false
    },
    acceptBulkOrder: {
      type: Boolean,
      default: false
    },
    minQuantityForBulkOrder: {
      type: Number,
      default: 0
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    listonline: {
      type: Boolean
    },
    variant: {
      type: Object
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

ProductSchema.pre('save', async function(next) {
  let product = this;
  return next();
});

ProductSchema.plugin(aggregatePaginate);


module.exports = mongoose.model('products', ProductSchema);
