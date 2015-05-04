/*jslint nomen: true*/
/*global console, require, process, __dirname, module, exports */
var fortune = require('../lib/fortune.js'),
    credentials = require('../credentials.js'),
    emailService = require('../lib/email.js')(credentials);

var home = function (req, res) {
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
};

var about = function (req, res) {
    'use strict';
    //retrieving cookie 
    var monster = req.cookies.monster,
        signedMonster = req.signedCookies.signed_monster;
    // console.log("unsigned Cookie:" + monster);
    // console.log("signed cookie:" + signedMonster);
    res.render('about', {
        fortune: fortune.getFortune(),
        pageTestScript: '/qa/tests-about.js'
    });
};

var newsletter = function (req, res) {
    'use strict';
    // we will learn about CSRF later...for now, we just
    // provide a dummy value
    res.render('newsletter', {
        csrf: 'CSRF token goes here'
    });
};

var newsletterArchive = function (req, res) {
    'use strict';
    res.render('newsletter/archive');
};

function NewsletterSignup() {
    'use strict';
}
NewsletterSignup.prototype.save = function (cb) {
    'use strict';
    cb();
};

var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

var newsletterProcessPost = function (req, res) {
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
                message: 'There was a database error; please try again later.'
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
            message: 'You have now been signed up for the newsletter.'
        };

        console.log("sending mail");
        var body = '<h1>Meadowlark Travel</h1>\n<p>Thanks for book your trip with ' +
            'Meadowlark Travel. <b>We look forward to your visit!</b>';
        emailService.send('pradeep.bhaduria@yahoo.co.in', 'Meadowlark travel tour', body);

        return res.redirect(303, '/newsletter/archive');
    });
};

var thankYou = function (req, res) {
    'use strict';
    res.render('/thank-you');
};

var process = function (req, res) {
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
};

exports.home = home;
exports.about = about;
exports.newsletter = newsletter;
exports.newsletterArchive = newsletterArchive;
exports.newsletterProcessPost = newsletterProcessPost;
exports.thankYou = thankYou;
exports.process = process;