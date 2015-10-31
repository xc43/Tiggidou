/**
 * Created by dave on 28/09/15.
 */

var DB = require('../config/database');

var Users = DB.Model.extend({
    tableName: 'users',
    idAttribute: 'idUser',
    comments: function() {
        return this.hasMany(Comments, 'commentIssuer');
    }
});

var Ratings = DB.Model.extend({
    tableName: 'ratings',
    idAttribute: 'idRating'
});


var Travel = DB.Model.extend({
   tableName: 'travel',
   idAttribute: 'idAddTravel'

});

var TravelRequest = DB.Model.extend({
   tableName: 'searchTravel',
   idAttribute: 'idSearchTravel'

});

var Comments = DB.Model.extend({
    tableName: 'comments',
    idAttribute: 'commentId',
    user: function () {
        return this.belongsTo(Users, 'idUser');
    }
});

module.exports = {
    Users: Users,
    ratings: Ratings,
    travel : Travel,
    TravelRequest : TravelRequest,
    comments: Comments
};
