// app/routes.js
module.exports = function(app, passport, db) {

  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get('/', function(req, res) {
    res.render('index.ejs');
  });

  // PROFILE SECTION =========================
  app.get('/profile', isLoggedIn, async function(req, res) {
    try {
      console.log('GET /profile for user:', req.user && req.user.local && req.user.local.email);

      const messages = await db.collection('messages')
        .find()
        .toArray();

      console.log('Loaded messages count:', messages.length);

      res.render('profile.ejs', {
        user: req.user,
        messages: messages
      });
    } catch (err) {
      console.log('Error loading messages:', err);
      res.status(500).send('Error loading messages');
    }
  });

  // LOGOUT ==============================
  app.get('/logout', function(req, res) {
    req.logout(() => {
      console.log('User has logged out!');
    });
    res.redirect('/');
  });

  // message board routes ===============================================================

  // create message
  app.post('/messages', async (req, res) => {
    try {
      await db.collection('messages').insertOne({
        name: req.body.name,
        msg: req.body.msg,
        thumbUp: 0,
        thumbDown: 0
      });
      console.log('saved to database');
      res.redirect('/profile');
    } catch (err) {
      console.log('Error saving message:', err);
      res.status(500).send('Error saving message');
    }
  });

  // thumb up
  app.put('/messages', async (req, res) => {
    try {
      const result = await db.collection('messages').findOneAndUpdate(
        { name: req.body.name, msg: req.body.msg },
        {
          $set: {
            thumbUp: req.body.thumbUp + 1
          }
        },
        {
          sort: { _id: -1 },
          upsert: true,
          returnDocument: 'after'
        }
      );
      res.send(result);
    } catch (err) {
      console.log('Error in thumb up:', err);
      res.status(500).send(err);
    }
  });

  // thumb down
  app.put('/messagesDown', async (req, res) => {
    try {
      const result = await db.collection('messages').findOneAndUpdate(
        { name: req.body.name, msg: req.body.msg },
        {
          $set: {
            thumbUp: req.body.thumbUp - 1
          }
        },
        {
          sort: { _id: -1 },
          upsert: true,
          returnDocument: 'after'
        }
      );
      res.send(result);
    } catch (err) {
      console.log('Error in thumb down:', err);
      res.status(500).send(err);
    }
  });

  // delete message
  app.delete('/messages', async (req, res) => {
    try {
      await db.collection('messages').findOneAndDelete({
        name: req.body.name,
        msg: req.body.msg
      });
      res.send('Message deleted!');
    } catch (err) {
      console.log('Error deleting message:', err);
      res.status(500).send(err);
    }
  });

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get('/login', function(req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  // process the login form (custom callback so we can log things)
  app.post('/login', function(req, res, next) {
    console.log('POST /login received');

    passport.authenticate('local-login', function(err, user, info) {
      console.log('passport.authenticate callback called');
      console.log('   err:', err);
      console.log('   user:', user ? user._id : null);
      console.log('   info:', info);

      if (err) {
        console.log('Error in login:', err);
        return next(err);
      }

      if (!user) {
        console.log('Login failed: no user');
        req.flash('loginMessage', (info && info.message) || 'Login failed.');
        return res.redirect('/login');
      }

      req.logIn(user, function(err) {
        if (err) {
          console.log('Error in req.logIn:', err);
          return next(err);
        }

        console.log('Login success for', user.local && user.local.email);
        return res.redirect('/profile');
      });
    })(req, res, next);
  });

  // SIGNUP =================================
  // show the signup form
  app.get('/signup', function(req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
  }));

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================

  // local -----------------------------------
  app.get('/unlink/local', isLoggedIn, function(req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function(err) {
      res.redirect('/profile');
    });
  });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/');
}
