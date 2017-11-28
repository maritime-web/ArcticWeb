(function () {
    "use strict";

    var logServiceModule = angular.module('embryo.logService', []);

    logServiceModule.factory('LogService', function ($http) {
        return {
            search: function (search, callback, error) {
                $http.get(embryo.baseUrl + "rest/log/search", {
                    params: search
                }).then(function (response) {
                    callback(response.data);
                }).catch(function (response) {
                    error(embryo.ErrorService.extractError(response.data, response.status, response.config));
                });
            },
            services: function (callback, error) {
                $http.get(embryo.baseUrl + "rest/log/services")
                    .then(function (response) {
                        callback(response.data);
                    })
                    .catch(function (response) {
                        error(embryo.ErrorService.extractError(response.data, response.status, response.config));
                    });
            }

        };
    });

}());
