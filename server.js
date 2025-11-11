// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
require('dotenv').config(); // add this so .env works locally
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

var configDB = require('./config/database.js'); // still fine to keep

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
require('dotenv').config();
var configDB = require('./config/database.js');

// prefer the environment variable on Render, fallback to local config
const mongoURI = process.env.MONGODB_URI || configDB.url;

if (!mongoURI) {
  console.error('No MongoDB URI set. Set MONGODB_URI or check configDB.url.');
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB');

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
