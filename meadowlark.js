/*jslint nomen: true*/
/*global console, require, process, __dirname, module */

var express = require('express'),
    Vacation = require('./handlers/vacation.js'),
    app = express(),
    credentials = require('./credentials.js'),
    fs = require('fs');

// set up handlebars view engine
var handlebars = require('express3-handlebars').create({
    defaultLayout: 'main',
    helpers: {
        section: function (name, options) {
            'use strict';
            if (!this._sections) {
                this._sections = {};
            }
            this._sections[name] = options.fn(this);
            return null;
        }
    }
});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);

var MongoSessionStore = require('session-mongoose')(require('connect'));
var sessionStore = new MongoSessionStore({
    url: credentials.mongo.development.connectionString
});

app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
    store: sessionStore,
    saveUninitialized: true,
    resave: true
}));

//===========

var auth = require('./lib/auth.js')(app, {
    providers: credentials.authProviders,
    successRedirect: '/about',
    failureRedirect: '/unauthorized',
});
// auth.init() links in Passport middleware:
auth.init();
// now we can specify our auth routes:
auth.registerRoutes();
//==========

app.use(express.static(__dirname + '/public'));
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use('/api', require('cors')());

// database configuration
var mongoose = require('mongoose');
var options = {
    server: {
        socketOptions: {
            keepAlive: 1
        }
    }
};

switch (app.get('env')) {
case 'development':
    mongoose.connect(credentials.mongo.development.connectionString, options);
    break;
case 'production':
    mongoose.connect(credentials.mongo.production.connectionString, options);
    break;
default:
    throw new Error('Unknown execution environment: ' + app.get('env'));
}

Vacation.initVacation();


// flash message middleware
app.use(function (req, res, next) {
    'use strict';
    // if there's a flash message, transfer
    // it to the context, then clear it
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});

app.use(function (req, res, next) {
    'use strict';
    res.locals.showTests = app.get('env') !== 'production' &&
        req.query.test === '1';
    next();
});

//to log the different workers
app.use(function (req, res, next) {
    'use strict';
    var cluster = require('cluster');
    if (cluster.isWorker) {
        console.log('Worker %d received request', cluster.worker.id);
    }
    next();
});

// add routes
require('./routes.js')(app);

app.get('/epic-fail', function (req, res) {
    process.nextTick(function () {
        console.log("Throwing error");
        throw new Error('Kaboom!');
    });
});

app.get('/account', function (req, res) {
    console.log("showing account", req.session.passport.user);
    if (!req.session.passport.user){
        return res.redirect(303, '/unauthorized');
    }
    res.render('account');
});

// api
var Attraction = require('./models/attractions.js');
var rest = require('connect-rest');

// API configuration
var apiOptions = {
    context: '/api',
    domain: require('domain').create(),
};
// link API into pipeline
app.use(rest.rester(apiOptions));

rest.get('/attractions', function (req, content, cb) {
    console.log("Attractions requested");
    Attraction.find({
        approved: true
    }, function (err, attractions) {
        if (err) return cb({
            error: 'Internal error.'
        });
        cb(null, attractions.map(function (a) {
            return {
                name: a.name,
                description: a.description,
                location: a.location,
            };
        }));
    });
});

rest.post('/attraction', function (req, content, cb) {
    console.log("console.log");
    var a = new Attraction({
        name: req.body.name,
        description: req.body.description,
        location: {
            lat: req.body.lat,
            lng: req.body.lng
        },
        history: {
            event: 'created',
            email: req.body.email,
            date: new Date(),
        },
        approved: false,
    });
    a.save(function (err, a) {
        if (err) return cb({
            error: 'Unable to add attraction.'
        });
        cb(null, {
            id: a._id
        });
    });
});

rest.get('/attraction/:id', function (req, content, cb) {
    Attraction.findById(req.params.id, function (err, a) {
        if (err) return cb({
            error: 'Unable to retrieve attraction.'
        });
        cb(null, {
            name: a.name,
            description: a.description,
            location: a.location,
        });
    });
});



// add support for auto views
var autoViews = {};

app.use(function (req, res, next) {
    var path = req.path.toLowerCase();
    // check cache; if it's there, render the view
    if (autoViews[path]) return res.render(autoViews[path]);
    // if it's not in the cache, see if there's
    // a .handlebars file that matches
    if (fs.existsSync(__dirname + '/views' + path + '.handlebars')) {
        autoViews[path] = path.replace(/^\//, '');
        return res.render(autoViews[path]);
    }
    // no view found; pass on to 404 handler
    next();
});

// custom 404 page
app.use(function (req, res) {
    'use strict';
    res.status(404);
    res.render('404');
});

// custom 500 page
app.use(function (err, req, res, next) {
    'use strict';
    console.error(err.stack);
    res.status(500);
    res.render('500');
});

function startServer() {
    'use strict';
    app.listen(app.get('port'), function () {
        console.log('Express started in ' + app.get('env') +
            ' mode on http://localhost:' + app.get('port') +
            '; press Ctrl-C to terminate.');
    });
}

if (require.main === module) {
    // application run directly; start app server
    startServer();
} else {
    // application imported as a module via "require": export function
    // to create server
    module.exports = startServer;
}