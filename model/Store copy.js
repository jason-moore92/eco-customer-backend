const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const validator = require('validator')
const mongoosePaginate = require('mongoose-paginate-v2')
const Schema = mongoose.Schema
var moment = require('moment')
let today = moment().format("DD-MM-YYYY")

const StoreSchema = new mongoose.Schema(
  {
   
    
  },
  {
    versionKey: false,
    timestamps: true
  }
)

StoreSchema.index({ "mobile": 1 }, { unique: true })

StoreSchema.plugin(mongoosePaginate)

StoreSchema.index({ location: "2dsphere" })
module.exports = mongoose.model('Store', StoreSchema)