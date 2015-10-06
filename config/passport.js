/**
 * Created by dave on 28/09/15.
 * configuring the strategies for passport
 * http://passportjs.org/docs
 */

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var connection            = require('./database').dbConnection;
var UserModel = require('../models/user');
var bcrypt = require('bcrypt-nodejs');

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        console.log("serializePassport");
        done(null, user.email);
    });

    // used to deserialize the user
    passport.deserializeUser(function(email, done) {
        console.log("deserializePassport");
        new UserModel.Users({email:email}).fetch().then(function(user){
            done(null, user);
        })
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password'
        },
        function(email, password, done) {
            new UserModel.Users({email: email}).fetch().then(function(data) {
                console.log("strategie login");
                var user = data;
                if(user) {
                    return done(null, false, {title: 'signup', errorMessage: 'username already exists'});
                } else {
                    // MORE VALIDATION GOES HERE(E.G. PASSWORD VALIDATION)
                    var password = user.password;
                    var hash = bcrypt.hashSync(password);

                    var signUpUser = new Model.User({email: user.email, password: hash});

                    signUpUser.save().then(function(model) {
                        // sign in the newly registered user
                        loginPost(req, res, next);
                    });
                }
                    user = data.toJSON();
                    if(!bcrypt.compareSync(password, user.password)) {
                        return done(null, false, {message: 'Invalid email or password'});
                    } else {
                        return done(null, user);
                    }
                }
            );
        }));
    /*passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) {
            process.nextTick(function(){
                console.log("email:" + email + " password: " + password );
                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                connection.query("select * from users where email = '"+email+"'",function(err,rows){
                    console.log(rows);
                    console.log("above row object");
                    if (err)
                        return done(err);
                    if (rows.length) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {

                        // if there is no user with that email
                        // create the user
                        var newUser = new Object();

                        newUser.email    = email;
                        newUser.password = password; // use the generateHash function in our user model

                        var insertQuery = "INSERT INTO users ( email, password ) values ('" + email +"','"+ password +"')";
                        console.log(insertQuery);
                        connection.query(insertQuery,function(err,rows){
                            newUser.id = rows.insertId;

                            return done(null, newUser);
                        });
                    }
                });
            });
        }));*/

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login',new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        },
        function(email, password, done) {
            new UserModel.Users({email: email}).fetch().then(function(data) {
                console.log("strategie login");
                var user = data;
                if(user === null) {
                    return done(null, false, {message: 'Invalid email or password'});
                } else {
                    user = data.toJSON();
                    if(!bcrypt.compareSync(password, user.password)) {
                        return done(null, false, {message: 'Invalid email or password'});
                    } else {
                        return done(null, user);
                    }
                }
            });
        }
    ));

};