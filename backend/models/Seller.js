const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  sellerName: {
    type: String,
    required: true
  },
  farmName: {
    type: String,
    default: ''
  },
  farmSize: {
    type: Number,
    default: 0
  },
  farmSizeUnit: {
    type: String,
    default: 'hectares'
  },
  location: {
    type: String,
    default: ''
  },
  assignedManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  harvestDetails: {
    variety: {
      type: String,
      default: ''
    },
    coffeeCherriesKg: {
      type: Number,
      default: 0,
      min: 0
    },
    coffeeSeedlingsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastHarvestDate: {
      type: Date,
      default: null
    }
  },
  processDetails: {
    variety: {
      type: String,
      default: ''
    },
    processedCoffeeKg: {
      type: Number,
      default: 0,
      min: 0
    },
    processDate: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: ''
    }
  },
  inventoryDetails: {
    fertilizerBags: {
      type: Number,
      default: 0,
      min: 0
    }
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

sellerSchema.index({ assignedManager: 1 });

module.exports = mongoose.model('Seller', sellerSchema);
