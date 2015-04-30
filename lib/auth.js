var User = require('../models/user.js'),
    passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy,
    GoogleStrategy = require('passport-google-openidconnect').Strategy;
//GoogleStrategy = require('passport-google').Strategy;

passport.serializeUser(function (user, done) {
    done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        if (err || !user) return done(err, null);
        done(null, user);
    });
});

module.exports = function (app, options) {
    // if success and failure redirects aren't specified,
    // set some reasonable defaults
    if (!options.successRedirect) {
        //options.successRedirect = '/account';
        options.successRedirect = '/about';
    }
    if (!options.failureRedirect) {
        options.failureRedirect = '/newsletter';
    }
    return {
        init: function () {
            var env = app.get('env');
            var config = options.providers;

            // configure Facebook strategy
            passport.use(new FacebookStrategy({
                clientID: config.facebook[env].appId,
                clientSecret: config.facebook[env].appSecret,
                callbackURL: '/auth/facebook/callback'
            }, function (accessToken, refreshToken, profile, done) {
                console.log("this is first");
                var authId = 'facebook:' + profile.id;
                User.findOne({
                    authId: authId
                }, function (err, user) {
                    if (err) return done(err, null);
                    if (user) return done(null, user);
                    user = new User({
                        authId: authId,
                        name: profile.displayName,
                        created: Date.now(),
                        role: 'customer'
                    });
                    user.save(function (err) {
                        if (err) return done(err, null);
                        done(null, user);
                    });
                });
            }));

            //configure Google Strategy
            passport.use(new GoogleStrategy({
                // returnURL: 'http://' + host + '/auth/google/return',
                //  realm: 'http://' + host + '/'
                clientID: config.google[env].appId,
                clientSecret: config.google[env].appSecret,
                callbackURL: '/auth/google/callback'
            }, function (identifier, profile, done) {
                var authId = 'google:' + identifier;
                User.findOne({
                    authId: authId
                }, function (err, user) {
                    if (err) return done(err, null);
                    if (user) return done(null, user);
                    user = new User({
                        authId: authId,
                        name: profile.displayName,
                        created: Date.now(),
                        role: 'customer'
                    });
                    user.save(function (err) {
                        if (err) return done(err, null);
                        done(null, user);
                    });
                });
            }));


            app.use(passport.initialize());
            app.use(passport.session());
        },
        registerRoutes: function () {
                // register Facebook routes
                app.get('/auth/facebook', function (req, res, next) {
                    var baseUrl = req.protocol + "://" + req.hostname + ":" + app.get('port'),
                        path = req.query.redirect.replace(baseUrl, '');
                    console.log("path : ", path);
                    passport.authenticate('facebook', {
                        // callbackURL: '/auth/facebook/callback?redirect=' + encodeURIComponent(req.query.redirect)
                        callbackURL: '/auth/facebook/callback',
                        state: path
                    })(req, res, next);
                });

                app.get('/auth/facebook/callback', passport.authenticate('facebook', {
                        failureRedirect: options.failureRedirect
                            //successRedirect: options.successRedirect
                    }),
                    function (req, res) {
                        // we only get here on successful authentication
                        console.log('Auth Succseesful:', req.query.state);
                        res.redirect(303, req.query.state || options.successRedirect);
                    }
                );

                // register Google routes
                app.get('/auth/google', function (req, res, next) {
                    var baseUrl = req.protocol + "://" + req.hostname + ":" + app.get('port'),
                        path = req.query.redirect.replace(baseUrl, '');
                    passport.authenticate('google-openidconnect', {
                        callbackURL: '/auth/google/callback',
                        state:path
                    })(req, res, next);
                });
                app.get('/auth/google/callback', passport.authenticate('google-openidconnect', {
                        failureRedirect: options.failureRedirect
                    }),
                    function (req, res) {
                        console.log("Google Auth Successful");
                        // we only get here on successful authentication
                        res.redirect(303,  req.query.state || options.successRedirect);
                    }
                );
            } //end routes
    };
};