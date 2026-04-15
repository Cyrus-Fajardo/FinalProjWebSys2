const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Kaluppa Foundation', 'DTI', 'Group Manager', 'Farmer', 'Buyer'],
    required: true
  },
  isVerified: {
    type: Boolean,
    default: function setDefaultVerification() {
      return !['Farmer', 'Buyer'].includes(this.role);
    }
  },
  verificationCertificateUrl: {
    type: String,
    default: ''
  },
  verificationSubmittedAt: {
    type: Date,
    default: null
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  passwordChangedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
