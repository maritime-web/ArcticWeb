(function () {
    "use strict";

    var module = angular.module('embryo.sar.userPouch', ['embryo.pouchdb.services']);

    module.factory('UserPouch', ['PouchDBFactory','$log', function (PouchDBFactory, $log) {
        // make sure this works in development environment as well as other environments
        var dbName = 'embryo-user';
        var userDb = PouchDBFactory.createLocalPouch(dbName);
        userDb.setMaxListeners(20);
        var remoteDb = PouchDBFactory.createRemotePouch(dbName);

         var handler = userDb.replicate.from(remoteDb, {
            retry: true
         });

         // TODO setup scheduled replication
         handler.on("complete", function (){
            $log.info("Done replicating users");
         });
         handler.on("error", function (error){
            $log.info(error);
         });


        return userDb;
    }]);



})();
