const mongoose = require('mongoose');
var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const Schema = mongoose.Schema;

const StoreSchema = new Schema(
  {
    businessType: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    subType: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'India'
    },
    zipCode: {
      type: String
    },
    mobile: {
      type: String,
      required: true
    },
    gstIn: {
      type: String
    },
    email: {
      type: String
    },
    storetype: {
      type: String
    },
    servicetype: {
      type: String
    },
    delivery: {
      type: Boolean
    },
    deliverydistance: {
      type: String
    },
    deliveryInfo: {
      mode: {
        type: String,
        enum: ["NO_DELIVERY", "DELIVERY_BY_OWN", "DELIVERY_BY_PARTNER"]
      },
      deliveryDistance: {
        type: String
      },
      deliveryPartnerId: {
        type: String
      },
      minAmountForDelivery: {
        type: String
      },
      minAmountForFreeDelivery: {
        type: String
      }
    },
    minOrderAmountForDelivery: {
      type: Number,
      default: 0
    },
    location: {
      type: {
        type: String
      },
      coordinates: [Number]
    },
    representatives: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Users'
      }
    ],
    enabled: {
      type: Boolean,
      default: false
    },
    note: {
      type: String
    },
    connectedstoresstatus: {
      type: String
    },
    status: {
      isOpen: {
        type: Boolean
      },
      statusdate: {
        type: String
      }
    },
    services: [
      {
        service: {
          name: {
            type: String,
            required: true,
            enum: [
              'StoreRepresentatives',
              'ProductsManagement',
              'OrderManagement',
              'DeliveryManagement',
              'TradeMantriRepresentatives'
            ]
          },
          enabled: {
            type: Boolean,
            default: false
          }
        }
      }
    ],
    requested: {
      type: Schema.Types.Mixed
    },
    referedBy: {
      type: String
    },
    referralCode: {
      type: String,
      //required:true
    },
    profile: {
      ownerInfo: {
        firstName: {
          type: String
        },
        lastName: {
          type: String
        }
      },
      image: {
        type: String
      },
      returnPolicy: {
        type: String
      },
      termsAndConditions: {
        type: String
      },
      holidays: [Date],
      iAgree: {
        type: Boolean
      },
      hours: { type: Array, default: [] },
      // hours: [
      //   {
      //     day: {
      //       type: String
      //     },
      //     openingTime: {
      //       type: String
      //     },
      //     closingTime: {
      //       type: String
      //     },
      //     isWorkingDay: {
      //       type: Boolean,
      //       default: true
      //     }
      //   }
      // ]
    },
    businessPANnumber: {
      type: String
    },
    settings: {
      notification: { type: Boolean, default: true },
      bargainEnable: { type: Boolean, default: true },
      bargainOfferPricePercent: { type: Number},
    },
    referredBy: { type: String, default: "" },
    stateCode: { type: String},
    storeCode: { type: String },
  },
  {
    versionKey: false,
    timestamps: true
  }
);
StoreSchema.pre('save', async function(next) {
  let Store = this;
  return next();
});

StoreSchema.index({ location: '2dsphere' });

StoreSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('stores', StoreSchema);
