var credentials = require('../credentials.js');
var emailService = require('../lib/email.js')(credentials);

var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
var cartCheckOutProcessPost = function (req, res) {
    'use strict';
    var cart = req.session.cart,
        name = req.body.name || '',
        email = req.body.email || '';
    if (!cart) {
        req.next(new Error('Cart does not exist.'));
    }

    // input validation
    if (!email.match(VALID_EMAIL_REGEX)) {
        return req.next(new Error('Invalid email address.'));
    }
    // assign a random cart ID; normally we would use a database ID here
    cart.number = Math.random().toString().replace(/^0\.0*/, '');
    cart.billing = {
        name: name,
        email: email
    };
    res.render('email/cart-thank-you', {
            layout: null,
            cart: cart
        },
        function (err, html) {
            if (err) {
                console.log('error in email template');
            }
            //send mail
            emailService.send('pradeep.bhaduria@yahoo.co.in', 'Meadowlark travel tour', html);
        }
    );
    res.render('cart-thank-you', {
        cart: cart
    });
};

var setCurrency = function (req, res) {
    req.session.currency = req.params.currency;
    return res.redirect(303, '/vacations');

};

exports.cartCheckOutProcessPost = cartCheckOutProcessPost;
exports.setCurrency = setCurrency;