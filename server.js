// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;

var mongoose = require('mongoose');
console.log('Mongoose type:', typeof mongoose)
console.log('Has connect:', typeof mongoose.connect)
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configDB = require('./config/database.js');
// const type = require('mongoose/lib/schema/operators/type.js');

// set up our express application =============================================
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
  secret: 'rcbootcamp2021b', // session secret
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// database + routes + launch ==================================================
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('MONGODB_URI is not set.');
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB');

    // use the same connection for routes (for db.collection(...))
    const db = mongoose.connection.db;

    // configure passport (loads User model, etc.)
    require('./config/passport')(passport);

    // load all routes and pass in app, configured passport, and db
    require('./app/routes.js')(app, passport, db);

    // launch the app
    app.listen(port, () => {
      console.log('The magic happens on port ' + port);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

