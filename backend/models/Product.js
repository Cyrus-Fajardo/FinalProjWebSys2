const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productType: {
    type: String,
    enum: ['Coffee Seedlings', 'Coffee Cherries', 'Processed Coffee', 'Fertilizers'],
    required: true
  },
  variety: {
    type: String
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    enum: ['pieces', 'kg', 'bags']
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerRole: {
    type: String,
    enum: ['Kaluppa Foundation', 'Farmer'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  dateListed: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
