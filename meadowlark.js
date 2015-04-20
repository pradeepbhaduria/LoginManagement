/*jslint nomen: true*/
/*global console, require, process, __dirname */

var express = require('express');
var fortune = require('./lib/fortune.js');
var formidable = require('formidable');
var app = express();

var credentials = require('./credentials.js');
console.log(credentials);
var emailService = require('./lib/email.js')(credentials);

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

app.use(express.static(__dirname + '/public'));
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
    secret: 'top-secret',
    saveUninitialized: true,
    resave: true
}));


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

//app.use(require('body-parser')());
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.get('/newsletter', function (req, res) {
    'use strict';
    // we will learn about CSRF later...for now, we just
    // provide a dummy value
    res.render('newsletter', {
        csrf: 'CSRF token goes here'
    });
});

app.get('/newsletter/archive', function (req, res) {
    'use strict';
    res.render('newsletter/archive');
});

app.post('/process', function (req, res) {
    'use strict';
    console.log('Form (from querystring): ' + req.query.form);
    console.log('CSRF token (from hidden form field): ' + req.body._csrf);
    console.log('Name (from visible form field): ' + req.body.name);
    console.log('Email (from visible form field): ' + req.body.email);
    //res.redirect(303, '/thank-you');
    console.log(req.xhr);
    console.log(req.accepts('json,html'));

    if (req.xhr || req.accepts('json,html') === 'json') {
        // if there were an error, we would send { error: 'error description' }
        res.send({
            success: true
        });
    } else {
        // if there were an error, we would redirect to an error page
        res.redirect(303, '/thank-you');
    }
});
//=================
function NewsletterSignup() {
    'use strict';
}
NewsletterSignup.prototype.save = function (cb) {
    'use strict';
    cb();
};

var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

app.post('/newsletter', function (req, res) {
    'use strict';
    var name = req.body.name || '',
        email = req.body.email || '';
    console.log("name 123:" + name, "email 123:" + email);
    // input validation
    if (!email.match(VALID_EMAIL_REGEX)) {
        if (req.xhr) {
            return res.json({
                error: 'Invalid name email address.'
            });
        }
        req.session.flash = {
            type: 'danger',
            intro: 'Validation error!',
            message: 'The email address you entered was  not valid.'
        };
        return res.redirect(303, '/newsletter/archive');
    }
    new NewsletterSignup({
        name: name,
        email: email
    }).save(function (err) {
        if (err) {
            if (req.xhr) {
                return res.json({
                    error: 'Database error.'
                });
            }
            req.session.flash = {
                type: 'danger',
                intro: 'Database error!',
                message: 'There was a database error; please try again later.',
            };
            return res.redirect(303, '/newsletter/archive');
        }
        if (req.xhr) {
            return res.json({
                success: true
            });
        }
        req.session.flash = {
            type: 'success',
            intro: 'Thank you!',
            message: 'You have now been signed up for the newsletter.',
        };
        console.log("sending mail");
        var body = '<h1>Meadowlark Travel</h1>\n<p>Thanks for book your trip with ' +
'Meadowlark Travel. <b>We look forward to your visit!</b>';

        emailService.send('pradeep.bhaduria@yahoo.co.in','Meadowlark travel tour', 'Please find yout travel itenirary');
        return res.redirect(303, '/newsletter/archive');
    });
});


//=================

app.get('/', function (req, res) {
    'use strict';
    console.log("Request params:", req.params);
    console.log("Request query:", req.query);
    console.log("Request body:", req.body);
    //setting cookie in the first page
    res.cookie('monster', 'nom nom Unsigned');
    res.cookie('signed_monster', 'nom nom Signed', {
        signed: true
    });

    res.render("home");
});

app.get('/about', function (req, res) {
    'use strict';
    //retrieving cookie 
    var monster = req.cookies.monster,
        signedMonster = req.signedCookies.signed_monster;
    console.log("unsigned Cookie:" + monster);
    console.log("signed cookie:" + signedMonster);
    res.render('about', {
        fortune: fortune.getFortune(),
        pageTestScript: '/qa/tests-about.js'
    });
});

app.get('/tours/hood-river', function (req, res) {
    'use strict';
    res.clearCookie('monster');
    res.render('tours/hood-river');
});

app.get('/tours/request-group-rate', function (req, res) {
    'use strict';
    res.render('tours/request-group-rate');
});

app.get('/contest/vacation-photo', function (req, res) {
    'use strict';
    var now = new Date();
    res.render('contest/vacation-photo', {
        year: now.getFullYear(),
        month: now.getMonth()
    });
});

app.post('/contest/vacation-photo/:year/:month', function (req, res) {
    'use strict';
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) {
            return res.redirect(303, '/error');
        }
        console.log('received fields:');
        console.log(fields);
        console.log('received files:');
        console.log(files);
        res.redirect(303, '/thank-you');
    });

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

app.listen(app.get('port'), function () {
    'use strict';
    console.log('Express started on http://localhost:' +
        app.get('port') + '; press Ctrl-C to terminate.');
});