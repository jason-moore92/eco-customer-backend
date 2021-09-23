const mongoose = require('mongoose')

const EmailHistorySchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    subType: { type: String, required: false },
    subSubType: { type: String, required: false },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    messageId: { type: String, required: false },
    providerId: { type: String, required: true },
    feedbackId: { type: String, required: false },
    timestamp: { type: String, required: true },
  },
  {
    versionKey: false,
    timestamps: true
  }
)


module.exports = mongoose.model('email_histories', EmailHistorySchema)
