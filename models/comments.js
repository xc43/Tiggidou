/**
 * Created by dave on 09/11/15.
 */

var DB = require('../config/database');

var Comments = DB.Model.extend({
    tableName: 'comments',
    idAttribute: 'commentId',
    user: function () {
        return this.belongsTo(Users, 'idUser');
    }
});

//commentType: 0 => profil; 1 => travel; 2 => requestTravel/searchtravel

module.exports = {
    Comments: Comments
};
