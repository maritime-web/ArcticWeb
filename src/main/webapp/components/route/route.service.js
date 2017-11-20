(function () {
    "use strict";

    embryo.route = {};

    var module = angular.module('embryo.route')
        .service('RouteService', RouteService);
    RouteService.$inject = ['$http', 'SessionStorageService'];

    function RouteService($http, SessionStorageService) {
        var routeKey = function (routeId) {
            return 'route_' + routeId;
        };

        var selectedRoutes = [];

        return {
            getActiveMeta: function (mmsi, success, error) {
                var url = embryo.baseUrl + 'rest/route/active/meta/' + mmsi;
                $http.get(url)
                    .then(function (response) {
                        success(response.data);
                    })
                    .catch(error);
            },
            setActiveRoute: function (routeId, activity, callback, error) {
                $http.put(embryo.baseUrl + 'rest/route/activate/', {
                    routeId: routeId,
                    active: activity
                })
                    .then(function (response) {
                        callback(response.data);
                    })
                    .catch(function (response) {
                        var data = response.data;
                        var status = response.status;
                        var config = response.config;
                        error(embryo.ErrorService.extractError(data, status, config));
                    });
            },
            getRoute: function (routeId, callback) {
                // should routes be cached?
                var remoteCall = function (onSuccess) {
                    $http.get(embryo.baseUrl + 'rest/route/' + routeId)
                        .then(function (response) {
                            onSuccess(response.data);
                        });
                };
                SessionStorageService.getItem(routeKey(routeId), callback, remoteCall);
            },
            getRoutes: function (routeIds, onSuccess, onError) {
                var messageId = embryo.messagePanel.show({
                    text: "Loading routes ... "
                });
                var ids = "";
                for (var index in routeIds) {
                    if (ids.length > 0) {
                        ids += ":";
                    }
                    ids += routeIds[index];
                }
                $http.get(embryo.baseUrl + 'rest/route/list/' + ids)
                    .then(function (response) {
                        var routes = response.data;
                        embryo.messagePanel.replace(messageId, {
                            text: routes.length + " routes loaded.",
                            type: "success"
                        });
                        onSuccess(routes);
                    }).catch(function (response) {
                    var data = response.data;
                    var status = response.status;
                    var config = response.config;

                    var errorMsg = embryo.ErrorService.extractError(data, status, config);
                    embryo.messagePanel.replace(messageId, {
                        text: errorMsg,
                        type: "error"
                    });
                    if (onError) {
                        onError(errorMsg);
                    }
                });
            },
            save: function (route, voyageId, success, error) {
                $http.put(embryo.baseUrl + 'rest/route/save', {
                    route: route,
                    voyageId: voyageId
                }).then(function () {
                    SessionStorageService.setItem(routeKey(route.id), route);
                    success();
                }).catch(function (response) {
                    var data = response.data;
                    var status = response.status;
                    var config = response.config;

                    error(embryo.ErrorService.extractError(data, status, config));
                });
            },
            saveAndActivate: function (route, voyageId, callback, error) {
                $http.put(embryo.baseUrl + 'rest/route/save/activate', {
                    route: route,
                    voyageId: voyageId
                }).then(function () {
                    SessionStorageService.setItem(routeKey(route.id), route);
                    callback();
                }).catch(function (response) {
                    var data = response.data;
                    var status = response.status;
                    var config = response.config;

                    error(embryo.ErrorService.getText(data, status, config));
                });
            },
            addSelectedRoute: function (route) {
                selectedRoutes.push(route);
            },
            clearSelection: function () {
                return selectedRoutes = [];
            },
            removeSelection: function (route) {
                var index = -1;
                for (var j in selectedRoutes) {
                    if (selectedRoutes[j].id === route.id) {
                        index = j;
                    }
                }
                if (index >= 0) {
                    selectedRoutes.splice(index, 1);
                }
            },
            getSelectedRoutes: function () {
                return selectedRoutes;
            },
            clearFromCache: function (routeIds) {
                routeIds.forEach(function (routeId) {
                    SessionStorageService.removeItem(routeKey(routeId));
                });
            }
        };
    }

    module.run(function (RouteService) {
        embryo.route.service = RouteService;
    });
})();
