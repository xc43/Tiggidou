/**
 * Created by dave on 09/11/15.
 */

//load the model
var Model = require('../models/models');
var bcrypt = require('bcrypt-nodejs');
var https = require('https');
var Promise = require('bluebird');
var mailling = require('../config/mailer.js');
var log = require('../config/logger').log;
var moment = require("moment");
var multer = require('multer');
var pathAvatar = './public/images/avatar';
var utils = require('./utils.js');
//View en français
var header = require('../views/fr/header.js');
var foot = require('../views/fr/footer.js');
var strings = require('../views/fr/post.js');

module.exports = {
    postUploadProfileAvatar: postUploadProfileAvatar,
    postRateDriver: postRateDriver,
    postRatePassenger: postRatePassenger,
    postComment: postComment,
    postRide: postRide,
    postAddPassenger: postAddPassenger,
    postAddPropositionTransport: postAddPropositionTransport,
    postSignUp: postSignUp,
    postLogin: postLogin
};

function postUploadProfileAvatar(req, res){
    upload(req,res,function(err) {
        if(err) {
            //TODO ajouter les messages d'erreurs dans req.flash("profileMessage", err);
            return res.redirect('/profile');
        }

        var userSession = req.session.req.user;

        new Model.ModelUsers.Users({'email': userSession.attributes.email }).fetch().then(function(user){
            if(user){
                var filename = req.files.userPhoto.name;
                user.save({
                    avatar:  filename
                }, {method: 'update'});

                res.redirect('/profile');
            }
            else{
                //TODO ajouter les messages d'erreurs dans req.flash("profileMessage", utilisateur non existant);
                return res.redirect('/profile');
            }
        });
    });
}

function postRateDriver(req, res) {
    var ratePunctuality = utils.arrayOrNot(req.body.dPunctualityVote);
    var rateCourtesy = utils.arrayOrNot(req.body.dCourtesyVote);
    var rateReliability = utils.arrayOrNot(req.body.dReliabilityVote);
    var rateSecurity = utils.arrayOrNot(req.body.dSecurityVote);
    var rateComfort = utils.arrayOrNot(req.body.dComfortVote);

    var judgedUsername = req.body.usernameOfProfile;
    var votingUsername = req.session.req.user.attributes.idUser;

    new Model.ModelUsers.Users({'username':judgedUsername})
        .fetch()
        .then(function (user) {

            var vote = new Model.ModelRating.Ratings({'votingUser': votingUsername, 'judgedUser': user.get('idUser'), 'ratingType':'0'});
            vote.fetch().then(function (modelVoting) {
                if (modelVoting == null) {
                    vote.save(
                        {
                            dratingPunctuality: ratePunctuality,
                            dratingCourtesy:rateCourtesy,
                            dratingReliability:rateReliability,
                            dratingSecurity:rateSecurity,
                            dratingComfort:rateComfort
                        },
                        {method: 'insert'});
                } else {
                    vote.save(
                        {
                            dratingPunctuality: ratePunctuality,
                            dratingCourtesy:rateCourtesy,
                            dratingReliability:rateReliability,
                            dratingSecurity:rateSecurity,
                            dratingComfort:rateComfort
                        },
                        {method: 'update'});
                }})
                .then(function(){
                    res.redirect('/profile/'+judgedUsername);
                });

        })
        .catch(function(err){
            log.error(err);
        });

}

function postRatePassenger(req, res) {
    var ratePunctuality = utils.arrayOrNot(req.body.pPunctualityVote);
    var rateCourtesy = utils.arrayOrNot(req.body.pCourtesyVote);
    var ratePoliteness = utils.arrayOrNot(req.body.pPolitenessVote);

    var judgedUsername = req.body.usernameOfProfile;
    var votingUsername = req.session.req.user.attributes.idUser;

    new Model.ModelUsers.Users({'username':judgedUsername})
        .fetch()
        .then(function (user) {

            var vote = new Model.ModelRating.Ratings({'votingUser': votingUsername, 'judgedUser': user.get('idUser'), 'ratingType':'1'});
            vote.fetch().then(function (modelVoting) {
                if (modelVoting == null) {
                    vote.save(
                        {
                            pratingPunctuality: ratePunctuality,
                            pratingCourtesy:rateCourtesy,
                            pratingPoliteness:ratePoliteness
                        },
                        {method: 'insert'});
                } else {
                    vote.save(
                        {
                            pratingPunctuality: ratePunctuality,
                            pratingCourtesy:rateCourtesy,
                            pratingPoliteness:ratePoliteness
                        },
                        {method: 'update'});
                }})
                .then(function () {
                    res.redirect('/profile/'+judgedUsername);
                });
        })
        .catch(function(err){
            log.error(err);
        });
}

function postComment(req, res) {
    var commentTxt = req.body.comment;
    var commentIssuer = req.session.req.user.attributes.idUser;
    var username = req.body.usernameOfProfile;

    var typeOfComment = req.body.typeOfComment;

    if (typeOfComment == 0) {

        new Model.ModelUsers.Users({'username':username})
            .fetch()
            .then( function (user) {
                var commentaire = new Model.ModelComments.Comments({
                    'commentIssuer': commentIssuer,
                    'commentProfileId': user.get('idUser'),
                    'commentType': '0',
                    'comment': commentTxt
                });

                commentaire.save();
                res.redirect('/profile/' + username);

            })
            .catch(function(err){
                log.error(err);
            });

    } else if (typeOfComment == 1) {

        var commentaire = new Model.ModelComments.Comments({
            'commentIssuer': commentIssuer,
            'commentTravelId': username,
            'commentType': '1',
            'comment': commentTxt
        });

        commentaire.save();
        res.redirect('/travel/' + username);



    } else if (typeOfComment == 2) {

        var commentaire = new Model.ModelComments.Comments({
            'commentIssuer': commentIssuer,
            'commentReqTravelId': username,
            'commentType': '2',
            'comment': commentTxt
        });

        commentaire.save();
        res.redirect('/travelrequest/' + username);

    }

}

function postRide(req, res) {
    var pets = 0;
    var luggage =0;

    var radiusCurr=0;
    var radiusDest=0;
    var currCoordinates = req.body.curr_latlong;
    var destCoordinates = req.body.dest_latLong;
    var curr_arr = new Array(2);


    var dest_arr = new Array(2);
    var availableSeats = 1;

    //var newdate = date.split("/").reverse().join("/");
    var newdate = moment(req.body.datepicker, "DD/MM/YYYY").format("YYYY-MM-DD");

    if(currCoordinates.length!=0){
        curr_arr = currCoordinates.split(',');
    }

    if(destCoordinates.length!=0){
        dest_arr = destCoordinates.split(',');
    }


    if(req.body.radiusCurr.length!=0){
        radiusCurr = req.body.radiusCurr;
    }

    if(req.body.radiusDest.length!=0){
        radiusDest = req.body.radiusDest;
    }
    if(req.body.spinner_d!=0){
        availableSeats = req.body.spinner_d;
    }

    if(req.body.driverCheckbox == 'on') //insert into Travel
    {
        if(req.body.petsRadio_d == 'Yes') pets= 0;
        else pets = 1;

        if(req.body.luggageRadio_d == 'Yes') luggage= 0;
        else luggage = 1;

        new Model.ModelTravel.Travel().save({
                startAddress :req.body.currentLocation,
                destinationAddress:req.body.destination,
                departureTime:req.body.clockpicker,
                departureDate: newdate,
                petsAllowed : pets,
                driver:req.session.req.user.id,
                availableSeat:availableSeats,
                takenSeat: 0,
                radiusPickUp: radiusCurr,
                radiusDropOff: radiusDest,
                luggagesSize :luggage,
                latitudePickUp:curr_arr[0],
                longitudePickUp:curr_arr[1],
                latitudeDropOff:dest_arr[0],
                longitudeDropOff:dest_arr[1],
                locationPick:req.body.selectedPickupPoint,
                locationDrop:req.body.selectedDropOffPoint,
                comments: req.body.commentsRide_d,
                desiredAvgPassengerScore: utils.arrayOrNot(req.body.avgScorePassenger),
                cost:req.body.cost_d
        },

            {method: 'insert'}
        ).catch(function (err) {
                log.error(err);
            });
    }


    else //insert into searchTravel
    {
        if(req.body.petsRadio_p == 'Yes') pets= 0;
        else pets = 1;

        if(req.body.luggageRadio_d == 'Yes') luggage= 0;
        else luggage = 1;

        new Model.ModelTravelRequest.TravelRequest().save({
                startAddress :req.body.currentLocation,
                destinationAddress:req.body.destination,
                departureTime:req.body.clockpicker,
                departureDate: newdate,
                pets: pets,
                passenger:req.session.req.user.id,
                radiusPickUp: radiusCurr,
                radiusDropOff: radiusDest,
                latitudePickUp:curr_arr[0],
                longitudePickUp:curr_arr[1],
                latitudeDropOff:dest_arr[0],
                longitudeDropOff:dest_arr[1],
                luggageSize :luggage,
                comments: req.body.commentsRide_p,
                desiredAvgDriverScore: utils.arrayOrNot(req.body.avgScoreDriver)
            },
            {method: 'insert'}
        ).catch(function (err) {
                log.error(err);
            });
    }

    res.redirect('/');
}

function postAddPropositionTransport(req, res){
    var idTravelSearch = req.body.idTravelSearch;
    var idTransportOffer = req.body.travelOffer;
    var offerToAdd = new Model.ModelTransportOffer.TransportOffer({idtravel:idTransportOffer, idsearchtravel:idTravelSearch});
    offerToAdd.fetch()
        .then(function(transport){
            //Trouve une offre déjà existante
            if(transport){
                var backURL = req.headers.referer || '/';
                return res.redirect(backURL);
            }

            offerToAdd.save().then(function(model) {
                res.redirect('/')
            });
        })

}

function postAddPassenger(req, res) {
    //TODO What if 2 users add it at the same time? With only 1 place left? Revisit this

    var jsonObject = JSON.parse(req.body.jsonObject);
    var idTravel = jsonObject.idAddTravel;
    console.log(idTravel);

    if(req.user){
        new Model.ModelTravel.Travel().where({
            idAddTravel: idTravel
        }).fetch().then(function (user) {

            if( 0 <user.get('availableSeat')){

                Model.ModelTravel.updateSeats(idTravel, user.get('takenSeat'),  user.get('availableSeat') );
                Model.ModelTravelPassenger.add(idTravel,req.session.req.user.id);
                res.redirect('/');
            }
            else{
                //TODO msg d'erreur
                //Not available anymore
            }
        })
            .catch(function(err){
                log.error(err);
            });
    }
    else{
        req.flash("signupMessage", strings.notConnected);
        res.redirect('/login');
    }
}





function postSignUp(req, res, next, passport) {
    utils.verifyRecaptcha(req.body["g-recaptcha-response"], function(success){
        if(success){
            var user = req.body;
            var usernamePromise = null;

            usernamePromise = new Model.ModelUsers.Users({email: user.email}).fetch();
            return usernamePromise.then(function(model) {
                if(model) {
                    req.flash("signupMessage", strings.existingEmail);
                    res.redirect('/sign-up');

                } else {
                    var password = user.password;
                    var passwordConfirm = user.confirm_password;
                    if(!(password == passwordConfirm)){
                        req.flash("signupMessage", strings.differentPWDs);
                        res.redirect('/sign-up');
                    }

                    var birthDayString = req.body.birthday_year+"-"+req.body.birthday_month+"-"+req.body.birthday_day;
                    var birthday = moment(birthDayString, "YYYY-MM-DD");
                    if(!birthday.isValid()){
                        req.flash("signupMessage", "La date sélectionnée n'est pas valide");
                        res.redirect('/sign-up');
                    }
                    var age =  moment().diff(birthday, 'years');
                    var dateBirthday = birthday.toDate();
                    if(age < 17){
                        req.flash("signupMessage", strings.legallyMinor);
                        res.redirect('/sign-up');
                    }

                    var hash = bcrypt.hashSync(password);
                    var typeSign = "local";
                    var firstName = user.firstName;
                    var familyName = user.familyName;

                    var partialUsername = firstName+"."+familyName+".";

                    var promiseArr = [];

                    promiseArr.push(new Model.ModelUsers.Users().getUsernames(partialUsername+"%"));
                    var usernameTry;

                    Promise.all(promiseArr).then(function(usernames){

                        var counter = 0;
                        var bool = true;

                        while(bool){

                            usernameTry = partialUsername+counter;
                            var isValidUsername = true;
                            for (var i=0; i<usernames[0].length; ++i) {
                                if (usernames[0][i] == usernameTry) {
                                    isValidUsername=false;
                                    ++counter;
                                    break;
                                }
                            }

                            if (isValidUsername) {
                                bool = false;
                            }
                        }

                        var signUpUser = new Model.ModelUsers.Users({
                            email: user.email,
                            password: hash,
                            typeSignUp: typeSign,
                            firstName: firstName,
                            familyName: familyName,
                            birthday: dateBirthday,
                            username: usernameTry
                        });

                        signUpUser.save().then(function(model) {
                            // sign in the newly registered user
                            postLogin(req, res, next, passport);
                        });
                    });
                }
            })
                .catch(function(err){
                    log.error(err);
                })
        } else {
            var user = req.body;
            req.flash("signupMessage", strings.failedCaptcha);
            res.redirect('/sign-up');
        }
    })
}

function postLogin(req, res, next, passport) {
    passport.authenticate('local-login', {
            successRedirect : '/profile',
            failureRedirect : '/login',
            failureFlash : true //allow flash message
        },
        function(err, user, info) {
            //error
            if(err) {
                req.flash("loginMessage", err);
                return res.redirect('/login');
            }
            //user don't exist
            if(!user) {
                req.flash("loginMessage", info["message"]);
                return res.redirect('/login');
            }
            return req.logIn(user, function(err) {
                //error when trying to login with session
                if(err) {
                    req.flash("loginMessage", err);
                    return res.redirect('/login');
                } else {
                    return res.redirect('/profile');
                }
            });
        })(req, res, next);
}

//uploading
// https://github.com/expressjs/multer
var upload = multer({
    dest: pathAvatar,
    /*limits: {
     fieldNameSize: 100,
     files: 2,
     fields: 5
     },*/
    rename: function(fieldname, filename){
        return Math.random() + Date.now();
    },
    onFileUploadStart: function (file){
        log.info(file.originalname + ' is starting ...');
    },
    onFileUploadComplete: function (file){
        log.info(file.fieldname + ' uploaded to ' + file.path);
    }
});