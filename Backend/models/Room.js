const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true,
  },
  roomType: {
    type: String,
    required: true, // Example: 'Single', 'Double', 'Suite'
  },
  pricePerNight: {
    type: Number,
    required: true,
  },
  amenities: [String], // Example: 'WiFi', 'TV', 'Mini-bar'
  availability: {
    type: Boolean,
    default: true,
  },
  maxOccupancy: {
    type: Number,
    required: true,
  },
  images: [
    {
      data: Buffer, // Store image binary data
      contentType: String, // MIME type for the image (e.g., 'image/jpeg')
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Room', RoomSchema);
