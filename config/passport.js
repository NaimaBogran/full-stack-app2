// config/passport.js

const LocalStrategy = require('passport-local').Strategy;
const User          = require('../app/user');

module.exports = function(passport) {

  // =========================================================================
  // passport session setup
  // =========================================================================
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(async function(id, done) {
    try {
      const user = await User.findById(id).exec();
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  });

  // =========================================================================
  // LOCAL SIGNUP
  // =========================================================================
  passport.use(
    'local-signup',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
      },
      async function(req, email, password, done) {
        try {
          // check if a user with that email already exists
          const existingUser = await User.findOne({ 'local.email': email }).exec();

          if (existingUser) {
            return done(
              null,
              false,
              req.flash('signupMessage', 'That email is already taken.')
            );
          }

          // create a new user
          const newUser = new User();
          newUser.local.email = email;
          newUser.local.password = newUser.generateHash(password);

          await newUser.save();
          return done(null, newUser);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // =========================================================================
  // LOCAL LOGIN
  // =========================================================================
  passport.use(
    'local-login',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
      },
      async function(req, email, password, done) {
        try {
          const user = await User.findOne({ 'local.email': email }).exec();

          if (!user) {
            return done(
              null,
              false,
              req.flash('loginMessage', 'No user found.')
            );
          }

          if (!user.validPassword(password)) {
            return done(
              null,
              false,
              req.flash('loginMessage', 'Oops! Wrong password.')
            );
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
};
