const mongoose = require('mongoose')

var aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const Schema = mongoose.Schema
const AppliedJobSchema = new mongoose.Schema(
{
    storeId: {
        type: String,
        required: true
    },
    jobId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    experience: {
        type: String,
        required: true
    },
    yearOfExperience: {
        type: Number,
        required: true
    },
    education: {
        type: String,
        required: true
    },
    aadhar: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    approvalStatus: {
        type: String,
        default: ""
    },
    comments: {
        type: String,
        default: ""
    },
    image: {
        type: String,
        default: ""
    },
  },
  {
    versionKey: false,
    timestamps: true
  }
)
AppliedJobSchema.index({ location: '2dsphere' });

AppliedJobSchema.plugin(aggregatePaginate);
module.exports = mongoose.model('applied_jobs', AppliedJobSchema)
