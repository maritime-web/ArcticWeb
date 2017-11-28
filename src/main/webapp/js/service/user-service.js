(function () {
    "use strict";

    var userServiceModule = angular.module('embryo.userService', []);

    userServiceModule.factory('UserService', function ($http) {
        return {
            userList: function (callback, error) {
                $http.get(embryo.baseUrl + "rest/user/list")
                    .then(function (response) {
                        callback(response.data);
                    })
                    .catch(
                        function (response) {
                            error(embryo.ErrorService.extractError(response.data, response.status, response.config));
                        });
            },
            create: function (user, callback, error) {
                $http.put(embryo.baseUrl + "rest/user/create", user)
                    .then(function (response) {
                        callback(response.data);
                    })
                    .catch(
                        function (response) {
                            error(embryo.ErrorService.extractError(response.data, response.status, response.config));
                        });
            },
            edit: function (user, callback, error) {
                $http.put(embryo.baseUrl + "rest/user/edit", user).then(function (response) {
                    callback(response.data);
                }).catch(
                    function (response) {
                        error(embryo.ErrorService.extractError(response.data, response.status, response.config));
                    });
            },
            deleteUser: function (userName, callback, error) {
                $http({
                    method: "delete",
                    url: embryo.baseUrl + "rest/user/delete/" + userName
                }).then(function (response) {
                    callback(response.data);
                }).catch(function (response) {
                    error(embryo.ErrorService.extractError(response.data, response.status, response.config));
                });
            },
            sourceFilters: function (success, error) {
                $http.get(embryo.baseUrl + "rest/user/available-source-filters", {
                    timeout: embryo.defaultTimeout
                }).then(function (response) {
                    success(response.data);
                }).catch(function (response) {
                    error(embryo.ErrorService.errorStatus(response.data, response.status, "loading AIS source filters"), response.status);
                });
            },
            rolesCount: function (success, error) {
                $http.get(embryo.baseUrl + "rest/user/roles-count", {
                    timeout: embryo.defaultTimeout
                }).then(function (response) {
                    success(response.data);
                }).catch(function (response) {
                    error(embryo.ErrorService.errorStatus(response.data, response.status, "loading count of users with roles"), response.status);
                });
            }
        };
    });

}());
