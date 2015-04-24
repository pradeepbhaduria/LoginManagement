var requestGroupRate = function (req, res) {
    'use strict';
    res.render('tours/request-group-rate');
};

var hoodRiverTour = function (req, res) {
    'use strict';
    res.clearCookie('monster');
    res.render('tours/hood-river');
};

exports.requestGroupRate = requestGroupRate;
exports.hoodRiverTour = hoodRiverTour;