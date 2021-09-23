const mongoose = require('mongoose')

var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const Schema = mongoose.Schema
const StoreJobPostingsSchema = new mongoose.Schema(
{
    storeId: {
        type: String,
        required: true
    },
    jobTitle: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    peopleNumber: {
        type: String,
        required: true
    },
    minYearExperience: {
        type: String,
        required: true
    },
    jobType: {
        type: String,
        required: true
    },
    startDate: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
    },
    salaryFrom: {
        type: String,
        required: true
    },
    salaryTo: {
        type: String,
        required: true
    },
    salaryType: {
        type: String,
        required: true
    },
    benefits: {
        type: String,
        required: true
    },
    listonline: {
        type: Boolean,
        required: true
    },
    location: {
        type: { type: String },
        coordinates: [Number]
    },
    status: {
        type: String,
        required: true
    },
    skills: { type: Array, default: [] },
  },
  {
    versionKey: false,
    timestamps: true
  }
)
StoreJobPostingsSchema.index({ location: '2dsphere' });

StoreJobPostingsSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('store-job-postings', StoreJobPostingsSchema)
