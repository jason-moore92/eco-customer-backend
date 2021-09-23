const mongoose = require('mongoose')

var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const Schema = mongoose.Schema
const Announcement = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    datetobeposted: {
      type: String
    },
    images: { type: Array, default: [] },
    announcementto:{
      type:String,
    },
    type:{
      type:String
    },
    // store: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: 'Store'
    //   }
    // ],
    storeId:{
      type:String
    },
    couponId: {
      type: String
    },
    city:{
        type:String
    },
    location: {
      type: {
        type: String
      },
      coordinates: [Number]
    },
    active:{
      type:Boolean
    },
    // businessType:{
    //   type:String
    // }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

Announcement.plugin(aggregatePaginate);
module.exports = mongoose.model('announcements', Announcement)
