import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { env } from './env';
import { User } from '../models/User';
import { logger } from './logger';

// Serialize user to session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (env.google.clientId && env.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId,
        clientSecret: env.google.clientSecret,
        callbackURL: env.google.callbackUrl,
        scope: ['profile', 'email'],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          
          if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
          }

          // Check if user already exists
          let user = await User.findOne({ email });

          if (user) {
            // User exists - update Google info if not set
            if (!user.googleId) {
              user.googleId = profile.id;
              user.displayName = profile.displayName;
              user.profilePicture = profile.photos?.[0]?.value;
              user.authProvider = 'google';
              await user.save();
            }
            logger.info(`Google OAuth: Existing user logged in: ${email}`);
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            email,
            googleId: profile.id,
            displayName: profile.displayName,
            profilePicture: profile.photos?.[0]?.value,
            authProvider: 'google',
          });

          logger.info(`Google OAuth: New user created: ${email}`);
          return done(null, user);
        } catch (error) {
          logger.error('Google OAuth error:', error);
          return done(error as Error, undefined);
        }
      },
    ),
  );
} else {
  logger.warn('Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required');
}

export default passport;
