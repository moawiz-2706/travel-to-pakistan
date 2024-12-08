const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// User Registration
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);
    //const hashedPassword = await bcrypt.hash(password, 10)
    // Create user
    const user = await User.create({
      name,
      email,
      //password: hashedPassword,
      password,
      role: role || 'user',
      authType: 'local',
      verified: role === 'user' // Auto-verify for user role
    });

    // Respond with user info and token
    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: generateToken(user._id),
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// User Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password)

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    console.log(user.password)
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    // const isMatch = await bcrypt.compare(this.password, user.password);
    // if (!isMatch) {
    //   return res.status(411).json({ message: 'Invalid credentials' });
    // }
    if (!user || !password === user.password) {
            return res.status(401).json({ message: 'Invalid credentials' });
          }
      
          if (!user.verified) return res.status(403).json({ message: 'User not verified' });
    // Check if user is verified
    if (!user.verified) {
      return res.status(403).json({ message: 'User not verified. Please contact administrator.' });
    }

    // Respond with user info and token
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: generateToken(user._id),
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Google Authentication Callback
// exports.googleAuthCallback = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
//     }

//     const token = generateToken(req.user._id);

//     // Safely parse state
//     let role = 'user';
//     try {
//       if (req.query.state) {
//         const decodedState = JSON.parse(Buffer.from(req.query.state, 'base64').toString('utf-8'));
//         role = decodedState.role || req.user.role || 'user';
//       }
//     } catch (stateParseError) {
//       console.warn('Failed to parse state:', stateParseError);
//     }

//     // Construct redirect URL with additional security
//     const redirectUrl = new URL(process.env.FRONTEND_URL + '/auth/success');
//     redirectUrl.searchParams.append('token', token);
//     redirectUrl.searchParams.append('role', role);

//     res.redirect(redirectUrl.toString());
//   } catch (error) {
//     console.error('Google auth callback error:', error);
//     res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
//   }
// };
// Google Authentication Callback
// Google Auth Callback
// exports.googleAuthCallback = (req, res) => {
//   const token = generateToken(req.user._id);

//   // Construct response with user details and token
//   const userResponse = {
//     id: req.user._id,
//     name: req.user.name,
//     email: req.user.email,
//     role: req.user.role,
//     profilePicture: req.user.profilePicture,
//     token,
//   };

//   res.status(200).json({
//     message: 'Authentication successful',
//     user: userResponse,
//   });
// }


// User Verification

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: profilePicture } = payload;

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { googleId },
        { email }
      ]
    });

    if (!user) {
      // Create new user if not exists
      user = new User({
        name,
        email,
        googleId,
        profilePicture,
        verified: true,
        role: 'user'
      });
      await user.save();
    } else if (!user.googleId) {
      // Update existing user with Google ID if not present
      user.googleId = googleId;
      user.verified = true;
      user.profilePicture = profilePicture;
      await user.save();
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'Google login successful',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ 
      message: 'Google login failed', 
      error: error.message 
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('bookingHistory');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        bookingHistory: user.bookingHistory
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching user', 
      error: error.message 
    });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.verified = true;
    await user.save();

    res.json({ 
      message: 'User verified successfully', 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('User verification error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Logout
exports.logout = (req, res) => {
  try {
    // Clear any server-side session or token if needed
    // For most JWT implementations, logout is handled client-side
    res.json({ 
      message: 'Logged out successfully',
      clearToken: true 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      message: 'Logout failed', 
      error: error.message 
    });
  }
};

// Password Reset Request
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate password reset token
    const resetToken = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    // TODO: Implement email sending logic
    // Send email with reset link containing the token

    res.json({ 
      message: 'Password reset link sent to your email',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      message: 'Password reset request failed', 
      error: error.message 
    });
  }
};