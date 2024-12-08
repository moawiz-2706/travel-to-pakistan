const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');
const crypto = require('crypto');

module.exports = (passport) => {
  // JWT Strategy for verifying tokens
  passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
  }, async (jwt_payload, done) => {
    try {
      const user = await User.findById(jwt_payload.id);
      if (user) return done(null, user);
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  }));

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true,  // Allows access to the request object (req)
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });

      if (!user) {
        // Extract role from the state or default to 'user'
        let role = 'user';
        if (req.query.state) {
          try {
            const decodedState = JSON.parse(Buffer.from(req.query.state, 'base64').toString('utf-8'));
            role = decodedState.role || 'user';
          } catch (err) {
            console.error('Failed to decode role state:', err);
          }
        }

        // Create a new user if not found
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          password: crypto.randomBytes(20).toString('hex'),  // Random password for security
          profilePicture: profile.photos[0]?.value,
          verified: true,
          role,
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
