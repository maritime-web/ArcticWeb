/**
 * Created by jesper on 6/21/16.
 */

(function() {
    "use strict";

    var storageModule = angular.module('embryo.pouchdb.services', ['embryo.couchdb.services', 'pouchdb']);

    storageModule.service('PouchDBFactory', ['pouchDB', 'CouchConfigService', function (pouchDB, CouchConfigService) {
        return {
            createLocalPouch: function (dbName) {
                return pouchDB(dbName)
            },
            createRemotePouch : function(dbName){
                var couchUrl = CouchConfigService.createCouchDbUrl(dbName);
                var remoteUserDB = pouchDB(couchUrl, {
                    skipSetup: true,
                    ajax: {
                        withCredentials :false,
                        headers: CouchConfigService.createCouchHeaders()
                    }
                });
                return remoteUserDB
            }

        }
    }]);
}());

