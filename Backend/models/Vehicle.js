const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  make: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['sedan', 'suv', 'van', 'luxury'],
    required: true
  },
  seats: {
    type: Number,
    required: true
  },
  pricePerDay: {
    type: Number,
    required: true
  },
  features: [String],
  location: {
    city: String,
    address: String
  },
  averageRating: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Vehicle', vehicleSchema);