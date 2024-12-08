const express = require('express');
const passport = require('passport');
const { 
  register, 
  login, 
  googleAuthCallback, 
  verifyUser, 
  logout, 
  googleLogin,
  getCurrentUser,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// User Registration and Authentication Routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// router.get('/google', (req, res, next) => {
//   const { role } = req.query;  // Role passed from frontend query parameter
//   const state = role
//     ? Buffer.from(JSON.stringify({ role })).toString('base64')
//     : Buffer.from(JSON.stringify({ role: 'user' })).toString('base64');

//   passport.authenticate('google', {
//     scope: ['profile', 'email'],
//     state, // Pass role as state for role handling
//     prompt: 'select_account',
//     callbackURL: 'http://localhost:3000/auth/google/callback',
//   })(req, res, next);
// });

// // Google OAuth Callback
// router.get('/google/callback',
//   passport.authenticate('google', { session: false, failureRedirect: '/login' }),
//   googleAuthCallback
// );

// Protected Admin Routes
// Google OAuth Login Route
router.post('/google-login', googleLogin);

// Get Current User Route (Protected)
router.get('/me', protect, getCurrentUser);



router.put('/verify/:id',
  protect,
  authorize('admin'),
  verifyUser
);

module.exports = router;