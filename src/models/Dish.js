const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
  category: { type: String, required: true, trim: true, maxlength: 100 },
  price: { type: Number, required: true, min: 0.01 },
  available: { type: Boolean, default: true }
}, { timestamps: true, versionKey: false, strict: 'throw' });
schema.index({ category: 1, available: 1 });
schema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('Dish', schema);
