const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  categoryId: { type: String, required: true },
  categoryDesc: { type: String, required: true },
  image_url: { type: String, required: true },
  icon_url: { type: String, required: true },
});

CategorySchema.pre('save', async function(next) {
  let Category = this;
  return next();
});

module.exports = mongoose.model('categories', CategorySchema);
