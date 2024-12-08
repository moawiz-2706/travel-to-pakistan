const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
require('dotenv').config();
const session = require('express-session');
const MongoStore = require('connect-mongo');
const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const blogRoutes = require('./routes/blogRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const roomRoutes = require('./routes/roomRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
  }
}));

// Passport config
require('./config/passport')(passport);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/reviews', reviewRoutes);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tourism-db', {
  // useNewUrlParser: true,
  // useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});