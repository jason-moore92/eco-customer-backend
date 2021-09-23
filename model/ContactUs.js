const mongoose = require('mongoose')

var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const Schema = mongoose.Schema
const ContactUsSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      default: "website"
    },
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    title: {
      type: String
    },
    message: {
      type: String
    },
    email: {
      type: String
    },
    address: {
      type: String
    },

    status: {
      type: String,
      enum: ["Open", "Closed"],
      required: true,
      default: "Open"
    },
    supportDetails: [{
      handledBy: {
        type: String
      },
      handledByUserName: {
        type: String
      },
      handledDateTime: {
        type: Date,
        default: Date.now()
      },
      comments: {
        type: String,
      },

      status: {
        type: String,
        enum: ["Open", "Closed"]
      }
    }]
  },
  {
    versionKey: false,
    timestamps: true
  }
)

ContactUsSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('contactus', ContactUsSchema)

