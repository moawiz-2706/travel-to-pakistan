const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'hotel_owner', 'car_owner'],
    default: 'user'
  },
  phoneNumber: String,
  profilePicture: String,
  verified: {
    type: Boolean,
    default: false
  },
  googleId: String,
  bookingHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);