/*jslint nomen: true*/
/*global console, require, process, __dirname */

var express = require('express');
var fortune = require('./lib/fortune.js');
var formidable = require('formidable');
var app = express();

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


app.use(function (req, res, next) {
    'use strict';
    res.locals.showTests = app.get('env') !== 'production' &&
        req.query.test === '1';
    next();

});

app.use(require('body-parser')());
app.get('/newsletter', function (req, res) {
    'use strict';
    // we will learn about CSRF later...for now, we just
    // provide a dummy value

    res.render('newsletter', {
        csrf: 'CSRF token goes here'
    });

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

app.get('/', function (req, res) {
    'use strict';
    console.log("Request params:", req.params);
    console.log("Request query:", req.query);
    console.log("Request body:", req.body);
    res.render("home");
});

app.get('/about', function (req, res) {
    'use strict';
    res.render('about', {
        fortune: fortune.getFortune(),
        pageTestScript: '/qa/tests-about.js'

    });


});

app.get('/tours/hood-river', function (req, res) {
    'use strict';
    res.render('tours/hood-river');

});

app.get('/tours/request-group-rate', function (req, res) {
    'use strict';
    res.render('tours/request-group-rate');

});

app.get('/contest/vacation-photo', function (req, res) {
    var now = new Date();
    res.render('contest/vacation-photo', {
        year: now.getFullYear(),
        month: now.getMonth()
    });

});

app.post('/contest/vacation-photo/:year/:month', function (req, res) {

    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        if (err) return res.redirect(303, '/error');
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