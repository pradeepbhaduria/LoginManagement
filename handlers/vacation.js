/*jslint nomen: true*/
/*global console, require, process, __dirname, module, exports */


var Vacation = require('../models/vacation.js'),
    VacationInSeasonListener = require('../models/vacationInSeasonListener.js');

function convertFromUSD(value, currency) {
    'use strict';
    switch (currency) {
    case 'USD':
        return value * 1;
    case 'GBP':
        return value * 0.6;
    case 'BTC':
        return value * 0.0023707918444761;
    default:
        return NaN;
    }
}
var vacationList = function (req, res) {
    'use strict';
    Vacation.find({
        available: true
    }, function (err, vacations) {
        var currency = req.session.currency || 'USD';
        var context = {
            currency: currency,
            vacations: vacations.map(function (vacation) {
                return {
                    sku: vacation.sku,
                    name: vacation.name,
                    description: vacation.description,
                    inSeason: vacation.inSeason,
                    price: convertFromUSD(vacation.priceInCents / 100, currency),
                    qty: vacation.qty
                };
            })
        };
        switch (currency) {
        case 'USD':
            context.currencyUSD = 'selected';
            break;
        case 'GBP':
            context.currencyGBP = 'selected';
            break;
        case 'BTC':
            context.currencyBTC = 'selected';
            break;
        }
        res.render('vacations', context);
    });
};

var notifyMeWhenInSeason = function (req, res) {
    'use strict';
    res.render('notify-me-when-in-season', {
        sku: req.query.sku
    });
};

var notifyMeWhenInSeasonProcessPost = function (req, res) {
    'use strict';
    VacationInSeasonListener.update({
            email: req.body.email
        }, {
            $push: {
                skus: req.body.sku
            }
        }, {
            upsert: true
        },
        function (err) {
            if (err) {
                console.error(err.stack);
                req.session.flash = {
                    type: 'danger',
                    intro: 'Ooops!',
                    message: 'There was an error processing your request.'
                };
                return res.redirect(303, '/vacations');
            }
            req.session.flash = {
                type: 'success',
                intro: 'Thank you!',
                message: 'You will be notified when this vacation is in season.'
            };
            return res.redirect(303, '/vacations');
        }
    );

};

var initVacation = function () {
    // initialize vacations
    Vacation.find(function (err, vacations) {
        'use strict';
        if (vacations.length) {
            return;
        }

        new Vacation({
            name: 'Hood River Day Trip',
            slug: 'hood-river-day-trip',
            category: 'Day Trip',
            sku: 'HR199',
            description: 'Spend a day sailing on the Columbia and ' +
                'enjoying craft beers in Hood River!',
            priceInCents: 9995,
            tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
            inSeason: true,
            maximumGuests: 16,
            available: true,
            packagesSold: 0
        }).save();

        new Vacation({
            name: 'Oregon Coast Getaway',
            slug: 'oregon-coast-getaway',
            category: 'Weekend Getaway',
            sku: 'OC39',
            description: 'Enjoy the ocean air and quaint coastal towns!',
            priceInCents: 269995,
            tags: ['weekend getaway', 'oregon coast', 'beachcombing'],
            inSeason: false,
            maximumGuests: 8,
            available: true,
            packagesSold: 0
        }).save();

        new Vacation({
            name: 'Rock Climbing in Bend',
            slug: 'rock-climbing-in-bend',
            category: 'Adventure',
            sku: 'B99',
            description: 'Experience the thrill of rock climbing in the high desert.',
            priceInCents: 289995,
            tags: ['weekend getaway', 'bend', 'high desert', 'rock climbing', 'hiking', 'skiing'],
            inSeason: true,
            requiresWaiver: true,
            maximumGuests: 4,
            available: false,
            packagesSold: 0,
            notes: 'The tour guide is currently recovering from a skiing accident.'
        }).save();
    });
};

exports.vacationList = vacationList;
exports.notifyMeWhenInSeason = notifyMeWhenInSeason;
exports.notifyMeWhenInSeasonProcessPost = notifyMeWhenInSeasonProcessPost;
exports.initVacation = initVacation;