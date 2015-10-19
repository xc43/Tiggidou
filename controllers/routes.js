/**
 * Created by vasi2401 on 2015-09-18.
 */

//load the model
var covoso = require(__dirname + '/../models/covosocialSearchDepartures');
var express = require('express');
var Model = require('../models/user');
var bcrypt = require('bcrypt-nodejs');


// show routes to app
module.exports = function (app, passport) {


// routes ======================================================================

    // api ---------------------------------------------------------------------
    //single page application
    app.get('/', function (req, res) {
        res.render('fr/index.html');
    });

    // rechercher
    app.get('/search', function (req, res) {

        //faire une recherche et afficher son r�sultat

    });

    // profile
    app.get('/profile', requireAuth, function(req, res){
        res.render('fr/profile.html'/*, {
            user : req.user //get the user out of session and pass to template
        }*/)
    });

    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', { scope : ['email'] }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }));

    // =====================================
    // GOOGLE ROUTES =======================
    // =====================================
    // send to google to do the authentication
    // profile gets us their basic information including their name
    // email gets their emails
    app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }));

    // login
    app.get('/login', function(req, res) {
        if(req.user){
            res.redirect('/');
        }
        else{
            res.render('fr/login.html'/*, {message: req.flash('loginMessage')}*/);
        }
    });
    app.post('/login', loginPost);

    // signup
    app.get('/sign-up', function (req, res) {
        res.render('fr/sign-up.html'/*, {message: req.flash('signupMessage')}*/);
    });

    //processs the signup form
    app.post('/sign-up', function(req, res, next) {
        var user = req.body;
        var usernamePromise = null;
        usernamePromise = new Model.Users({email: user.email}).fetch();
        return usernamePromise.then(function(model) {
            if(model) {
                res.render('fr/sign-up.html', {title: 'signup', errorMessage: 'username already exists'});
            } else {
                // MORE VALIDATION GOES HERE(E.G. PASSWORD VALIDATION)
                var password = user.password;
                var hash = bcrypt.hashSync(password);
                var signUpUser = new Model.Users({email: user.email, password: hash});
                //TODO ajouter le type local

                signUpUser.save().then(function(model) {
                    // sign in the newly registered user
                    loginPost(req, res, next);
                });
            }
        })});

    app.get('/results', function (req, res) {
        res.render('fr/results.html')
    });

    app.get('/no-results', function (req, res) {
        res.render('fr/no-results.html')
    });

    app.get('/ask-ride', requireAuth, function (req, res) {
        res.render('fr/ask-ride.html')
    });
    app.get('/logout',requireAuth, function(req, res){
        req.logout();
        res.redirect('/');
    })

    //... ajouter plus de fonctionalit�s
    function loginPost(req, res, next) {
        passport.authenticate('local-login', {
                successRedirect : '/profile',
                failureRedirect : '/login',
                failureFlash : true //allow flash message
            },
            function(err, user, info) {
                if(err) {
                    return res.render('fr/login.html', {title: 'Login', errorMessage: err.message});
                }

                if(!user) {
                    return res.render('fr/login.html', {title: 'Login', errorMessage: info.message});
                }
                return req.logIn(user, function(err) {
                    if(err) {
                        return res.render('fr/login.html', {title: 'Login', errorMessage: err.message});
                    } else {
                        return res.redirect('/profile');
                    }
                });
            })(req, res, next);
    };

    function loginSignFacebook(req, res, next) {
        passport.authenticate('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/sign-up'
            },
            function(err, user, info) {
                if(err) {
                    return res.render('fr/login.html', {title: 'Login', errorMessage: err.message});
                }

                if(!user) {
                    return res.render('fr/login.html', {title: 'Login', errorMessage: info.message});
                }
                return req.logIn(user, function(err) {
                    if(err) {
                        return res.render('fr/login.html', {title: 'Login', errorMessage: err.message});
                    } else {
                        return res.redirect('/profile');
                    }
                });
            })(req, res, next);
    };

};

// route middleware to make sure a user is logged in
function requireAuth(req, res, next) {
    //Check if the user is logged in
    if (req.isAuthenticated()){
        return next();
    }

    res.redirect('/login');
};








