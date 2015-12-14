(function() {
    var module = angular.module('embryo.aton.service', []);
    
    module.service('AtonService', [ '$http',  '$log', function($http, $log) {
        var atonData = [];

        var that = this;

        that.getAtonData = function(callBack) {
            if (atonData.length == 0) {
                $http({method: 'GET', url: 'partials/avpg/aton-data.json'}).
                then(function(response) {
                    atonData = response.data;
                    $log.debug("Successfully loaded "+ atonData.length +" AtoN");
                    callBack(atonData);
                }, function(response) {
                    $log.debug("Failed to retrieve AtoN data. HTTP Status: '" + response.status + "'");
                });
            } else {
                callBack(atonData);
            }
        }
    } ]);
})();