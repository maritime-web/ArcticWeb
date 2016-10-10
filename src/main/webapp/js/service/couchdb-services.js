/**
 * Created by jesper on 6/21/16.
 */

(function() {
    "use strict";

    var module = angular.module('embryo.couchdb.services', ['embryo.authentication.service']);

    module.service('CouchConfigService', ['$location', 'Subject', function ($location, Subject) {
        return {
            createCouchDbUrl: function (dbName) {
                var couchUrl = undefined

                var url = $location.absUrl() ? $location.absUrl().toLocaleLowerCase() : "";
                if (url.indexOf("localhost:") < 0 && url.indexOf("127.0.0.1:") < 0) {
                    var host = $location.host().replace("arcticweb", "awc");
                    couchUrl = $location.protocol() + "://" + host + "/" + dbName;
                } else {
                    couchUrl = $location.protocol() + "://" + $location.host() + ":5984/" + dbName;
                    //couchUrl = $location.protocol() + "://" + $location.host() + "/couchdb/" + dbName;
                }
                return couchUrl;
            },
            createCouchHeaders : function(){
                var roles = Subject.roles()
                var rolesStr = "";
                for(var i in roles){
                    if(i > 0){
                        rolesStr += ","
                    }
                    rolesStr += roles[i];
                }
                return {
                     'X-Auth-Couchdb-UserName' : Subject.getDetails().userName,
                     'X-Auth-Couchdb-Roles' : rolesStr,
                     'X-Auth-Couchdb-Token' : Subject.getDetails().t
                }
            }

        }
    }]);
}());

