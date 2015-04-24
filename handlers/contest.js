/*jslint nomen: true*/
/*global console, require, process, __dirname, module, exports */

var formidable = require('formidable'),
    fs = require('fs');

var vacationPhoto = function (req, res) {
    'use strict';
    var now = new Date();
    res.render('contest/vacation-photo', {
        year: now.getFullYear(),
        month: now.getMonth()
    });
};

// make sure data directory exists
var dataDir = __dirname + '/data';
var vacationPhotoDir = dataDir + '/vacation-photo';
fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
fs.existsSync(vacationPhotoDir) || fs.mkdirSync(vacationPhotoDir);

function saveContestEntry(contestName, email, year, month, photoPath) {
    'use strict';
    // TODO...this will come later
}

var vacationPhotoProcessPost = function (req, res) {
    'use strict';
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        //if (err) return res.redirect(303, '/error');
        if (err) {
            res.session.flash = {
                type: 'danger',
                intro: 'Oops!',
                message: 'There was an error processing your submission. ' +
                    'Pelase try again.'
            };
            return res.redirect(303, '/contest/vacation-photo');
        }
        var photo = files.photo,
            dir = vacationPhotoDir + '/' + Date.now(),
            path = dir + '/' + photo.name;
        fs.mkdirSync(dir);
        fs.renameSync(photo.path, dir + '/' + photo.name);
        saveContestEntry('vacation-photo', fields.email,
            req.params.year, req.params.month, path);
        req.session.flash = {
            type: 'success',
            intro: 'Good luck!',
            message: 'You have been entered into the contest.'
        };
        return res.redirect(303, '/contest/vacation-photo/entries');
    });
};

exports.vacationPhoto = vacationPhoto;
exports.vacationPhotoProcessPost = vacationPhotoProcessPost;