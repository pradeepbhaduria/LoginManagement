/*jslint nomen: true*/
/*global console, require, process, __dirname */

var express = require('express');
var fortune = require('./lib/fortune.js');
var app = express();

// set up handlebars view engine

var handlebars = require('express3-handlebars').create({
    defaultLayout: 'main'
});

app.engine('handlebars', handlebars.engine);

app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
    'use strict';
    console.log("rendering Home");
    res.render("home");
});

app.get('/about', function (req, res) {
    'use strict';
    res.render('about', {
        fortune: fortune.getFortune()
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