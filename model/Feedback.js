const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const FeedbackSchema = new Schema({
  userId: { type: String, required: true },
  ratingValue: { type: Number, default: 0 },
  feedbackText: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

FeedbackSchema.pre('save', async function (next) {
  let Feedback = this;
  return next();
});

module.exports = mongoose.model('feedbacks', FeedbackSchema);
