const mongoose = require('mongoose');
require('./Room'); // Import Room schema

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    address: String,
    city: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  images: [
    {
      data: Buffer,
      contentType: String
    }
  ],
  rooms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    }
  ],
  amenities: [String],
  averageRating: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['available', 'unavailable'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Hotel', hotelSchema);
