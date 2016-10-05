(function () {
    "use strict";

    var module = angular.module('embryo.sar.livePouch', ['embryo.pouchdb.services']);

    module.factory('LivePouch', ['PouchDBFactory', '$log', function (PouchDBFactory, $log) {
        var dbName = 'embryo-live';
        var liveDb = PouchDBFactory.createLocalPouch(dbName);
        var remoteDb = PouchDBFactory.createRemotePouch(dbName);

        var sync = liveDb.sync(remoteDb, {
            live: true,
            retry: true
        }).on('change', function (info) {
            // handle change
        }).on('paused', function (err) {
            // replication paused (e.g. replication up to date, user went offline)
        }).on('active', function () {
            // replicate resumed (e.g. new changes replicating, user went back online)
        }).on('denied', function (err) {
            // a document failed to replicate (e.g. due to permissions)
            $log.error("Sync failed for document")
            $log.error(err)
        }).on('complete', function (info) {
            // handle complete
        }).on('error', function (err) {
            // handle error
        });

        return liveDb;
    }]);

})();
