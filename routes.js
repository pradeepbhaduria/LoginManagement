var main = require('./handlers/main.js'),
	contest = require('./handlers/contest.js'),
	vacation = require('./handlers/vacation.js'),
	cart = require('./handlers/cart.js'),
	contact = require('./handlers/contact.js');


module.exports = function (app) {
    app.get('/', main.home);
    app.get('/about', main.about);
    app.get('/thank-you', main.thankYou);
    app.get('/newsletter', main.newsletter);
    app.post('/newsletter', main.newsletterProcessPost);
    app.get('/newsletter/archive', main.newsletterArchive);
    app.post('/process', main.process);

    app.get('/vacations', vacation.vacationList);
    app.get('/notify-me-when-in-season', vacation.notifyMeWhenInSeason);
    app.post('/notify-me-when-in-season', vacation.notifyMeWhenInSeasonProcessPost);

    app.get('/contest/vacation-photo', contest.vacationPhoto);
    app.post('/contest/vacation-photo/:year/:month', contest.vacationPhotoProcessPost);

    app.post('/cart/checkout', cart.cartCheckOutProcessPost);
    app.get('/set-currency/:currency', cart.setCurrency);


    app.get('/tours/hood-river', contact.hoodRiverTour);
    app.get('/tours/request-group-rate', contact.requestGroupRate);
};