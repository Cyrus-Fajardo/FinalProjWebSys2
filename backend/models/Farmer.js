const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmerName: {
    type: String,
    required: true
  },
  farmName: {
    type: String,
    required: true
  },
  farmSize: {
    type: Number,
    required: true
  },
  farmSizeUnit: {
    type: String,
    default: 'hectares'
  },
  varietiesAvailable: [{
    type: String
  }],
  location: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Farmer', farmerSchema);
