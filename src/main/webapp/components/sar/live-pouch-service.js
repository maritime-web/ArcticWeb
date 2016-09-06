(function () {
    "use strict";

    var module = angular.module('embryo.sar.livePouch', ['embryo.pouchdb.services']);

    module.factory('LivePouch', ['PouchDBFactory', function (PouchDBFactory) {
        var dbName = 'embryo-live';
        var liveDb = PouchDBFactory.createLocalPouch(dbName);
        var remoteDb = PouchDBFactory.createRemotePouch(dbName);

        var sync = liveDb.sync(remoteDb, {
            live: true,
            retry: true
        })

        return liveDb;
    }]);

})();
