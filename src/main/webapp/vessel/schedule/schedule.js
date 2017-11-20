(function () {
    "use strict";

    var module = angular.module('embryo.vessel.schedule');

    var voyages = [];

    module.controller('ScheduleEditCtrl', ScheduleEditCtrl);
    ScheduleEditCtrl.$inject = ['$scope', 'ScheduleService', 'VesselInformation'];

    function ScheduleEditCtrl($scope, ScheduleService, VesselInformation) {
        var pageSize = 5;

        var idExists = function (voyages, id) {
            for (var vid in voyages) {
                if (voyages[vid].maritimeId == id) {
                    return vid;
                }
            }
            return false;
        };

        function loadSchedule(vs) {
            if ($scope.mmsi) {
                $scope.alertMessages = [];
                ScheduleService.getYourSchedule($scope.mmsi, function (schedule) {
                    $scope.idsOfVoyages2Delete = [];
                    voyages = schedule.voyages.slice();
                    if (vs) {
                        for (var i = vs.length - 1; i > -1; i--) {
                            var id = vs[i].maritimeId;
                            var foundVoyageId = idExists(voyages, id);
                            if (foundVoyageId) {
                                voyages[foundVoyageId] = vs[i];
                                vs.splice(i, 1);
                            }
                        }
                        voyages = voyages.concat(vs);
                    }
                    voyages.push({});
                    if (!vs || vs.length === 0) {
                        $scope.voyages = voyages.slice(0, pageSize);
                    } else {
                        $scope.voyages = voyages;
                    }
                    $scope.allVoyages = voyages.length;
                }, function (error) {
                    $scope.alertMessages = error;
                });
            }
        }


        $scope.provider = {
            doShow: false,
            title: "Schedule",
            type: "edit",
            available: function (vesselOverview, vesselDetails) {
                if (vesselOverview.inAW) {
                    if (vesselDetails.additionalInformation.routeId)
                        return {
                            text: "ACTIVE",
                            klass: "success",
                            action: "edit"
                        };
                    else
                        return {
                            text: "INACTIVE",
                            klass: "warning",
                            action: "edit"
                        };
                }
                return false;
            },
            show: function (vesselOverview, vesselDetails) {
                this.doShow = true;
                $scope.mmsi = vesselDetails.mmsi;
                $scope.vesselDetails = vesselDetails;
                $scope.activeRouteId = vesselDetails.additionalInformation.routeId;
                loadSchedule();
            },
            shown: function (vesselOverview, vesselDetails) {
                return this.doShow;
            },
            close: function () {
                this.doShow = false;
                $scope.reset();
            },
            updateSchedule: function (context) {
                $scope.mmsi = context.vesselDetails.mmsi;
                $scope.vesselDetails = context.vesselDetails;
                $scope.activeRouteId = context.vesselDetails.additionalInformation.routeId;

                if (context.scheduleResponse.voyages && context.scheduleResponse.voyages.length === 0) {
                    ScheduleService.clearYourSchedule();
                    $scope.message = "Schedule data uploaded. Note that uploaded schedule data dated in the past may not be shown.";
                }
                loadSchedule(context.scheduleResponse.voyages);
                $scope.alertMessages = context.scheduleResponse.errors;

                this.doShow = true;
            }
        };

        embryo.controllers.schedule = $scope.provider;

        $scope.close = function ($event) {
            $event.preventDefault();
            $scope.provider.close();
        };

        VesselInformation.addInformationProvider($scope.provider);

        $scope.options = {
            "Yes": true,
            "No": false
        };

        $scope.getLastVoyage = function () {
            if (!$scope.voyages) {
                return null;
            }
            return $scope.voyages[$scope.voyages.length - 1];
        };

        $scope.$watch($scope.getLastVoyage, function (newValue, oldValue) {
            // add extra empty voyage on initialization
            if (newValue && Object.keys(newValue).length > 0
                && (!oldValue || Object.keys(oldValue).length === 0)) {
                $scope.voyages.push({});
            }
        }, true);

        $scope.moreVoyages = function () {
            return $scope.voyages && $scope.voyages.length < voyages.length;
        };

        $scope.loadAll = function () {
            $scope.voyages = voyages;
        };

        $scope.loadMore = function () {
            if ($scope.voyages) {
                var vl = $scope.voyages.length;
                if (vl < voyages.length) {
                    $scope.voyages = voyages.slice(0, vl + pageSize);
                }
            }
        };

        $scope.del = function (index) {
            if ($scope.voyages[index].maritimeId) {
                $scope.idsOfVoyages2Delete.push($scope.voyages[index].maritimeId);
            }
            voyages.splice(index, 1);
            $scope.voyages.splice(index, 1);
        };

        $scope.uploadSchedule = function () {
            var biggestDate = 0;
            for (var x in voyages) {
                var departure = voyages[x].departure;
                if (departure > biggestDate) {
                    biggestDate = departure;
                }
            }
            VesselInformation.hideAll();
            embryo.controllers.uploadroute.show({
                schedule: true,
                departure: biggestDate,
                vesselDetails: $scope.vesselDetails
            });
        };
        $scope.resetMessages = function () {
            $scope.message = null;
            $scope.alertMessages = null;
        };

        $scope.reset = function () {
            $scope.resetMessages();
            $scope.idsOfVoyages2Delete = [];
            loadSchedule();
        };

        $scope.save = function () {
            // remove last empty element
            var scheduleRequest = {
                mmsi: $scope.mmsi,
                voyages: $scope.voyages.slice(0, $scope.voyages.length - 1),
                toDelete: $scope.idsOfVoyages2Delete
            };

            $scope.resetMessages();
            ScheduleService.save(scheduleRequest, function () {
                $scope.message = "Schedule saved successfully";
                loadSchedule();
            }, function (error) {
                $scope.alertMessages = error;
            });
        };
    }

    module.controller('ScheduleEditFormCtrl', ScheduleEditFormCtrl);
    ScheduleEditFormCtrl.$inject = ['$scope', '$q', 'VesselService', 'RouteService'];

    function ScheduleEditFormCtrl($scope, $q, VesselService, RouteService) {
        var berthUrl = embryo.baseUrl + 'rest/berth/search';

        var berths = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.nonword('value'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            prefetch: {
                url: berthUrl,
                // 1 week
                ttl: 7 * 24 * 60 * 60 * 1000
            },
            remote: berthUrl + "?q=%QUERY"
        });


        berths.initialize();

        $scope.getBerths = function (query) {
            return function () {
                var deferred = $q.defer();
                berths.get(query, function (suggestions) {
                    deferred.resolve(suggestions);
                });
                return deferred.promise;
            }().then(function (res) {
                return res;
            });
        };

        $scope.editRoute = function (index) {
            var context = {
                mmsi: $scope.mmsi,
                routeId: $scope.voyages[index].route ? $scope.voyages[index].route.id : null,
                voyageId: $scope.voyages[index].maritimeId,
                dep: $scope.voyages[index].location,
                etdep: $scope.voyages[index].departure,
                vesselDetails: $scope.vesselDetails
            };
            if (index < $scope.voyages.length - 1) {
                context.des = $scope.voyages[index + 1].location;
                context.etdes = $scope.voyages[index + 1].arrival;
            }

            $scope.provider.close();
            embryo.controllers.editroute.show(context);
        };

        $scope.saveable = function () {
            if ($scope.scheduleEditForm.$invalid) {
                return false;
            }

            return ($scope.voyages && $scope.voyages.length >= 1) || ($scope.idsOfVoyages2Delete && $scope.idsOfVoyages2Delete.length > 0);
        };

        $scope.activate = function (voyage) {
            $scope.resetMessages();
            RouteService.setActiveRoute(voyage.route.id, true, function () {
                VesselService.updateVesselDetailParameter($scope.mmsi,
                    "additionalInformation.routeId", voyage.route.id);
                $scope.activeRouteId = voyage.route.id;
            }, function (error) {
                $scope.alertMessages = error;
            });
        };
        $scope.deactivate = function (voyage) {
            $scope.resetMessages();
            RouteService.setActiveRoute(voyage.route.id, false, function () {
                VesselService.updateVesselDetailParameter($scope.mmsi,
                    "additionalInformation.routeId", "");
                $scope.activeRouteId = null;
            }, function (error) {
                $scope.alertMessages = error;
            });
        };

        $scope.uploadRoute = function (voyage) {
            $scope.provider.close();
            embryo.controllers.uploadroute.show({
                vesselDetails: $scope.vesselDetails,
                voyageId: voyage.maritimeId
            });
        };

        $scope.isActive = function (voyage) {
            if (!voyage || !voyage.route || !voyage.route.id) {
                return false;
            }

            if (!$scope.activeRouteId) {
                return false;
            }

            return $scope.activeRouteId === voyage.route.id;
        };
    }

    module.controller('VoyageCtrl', VoyageCtrl);
    VoyageCtrl.$inject = ['$scope'];

    function VoyageCtrl($scope) {
        function berthSelected(e, suggestion, dataset) {
            var voyage = $scope.$parent.voyage;
            voyage.latitude = suggestion.latitude;
            voyage.longitude = suggestion.longitude;
            voyage.location = suggestion.value;
            $scope.$apply();
        }

        $scope.$on('typeahead:selected', berthSelected);
        $scope.$on('typeahead:autocompleted', berthSelected);

        $scope.getCoords = function (item, model, label) {
            var voyage = $scope.$parent.voyage;
            voyage.latitude = item.latitude;
            voyage.longitude = item.longitude;
            // $scope.$apply();
        };

    }

    module.controller('ScheduleViewCtrl', ScheduleViewCtrl);
    ScheduleViewCtrl.$inject = ['$scope', 'ScheduleService', 'RouteService', 'VesselInformation', 'NotifyService', 'VesselEvents'];

    function ScheduleViewCtrl($scope, ScheduleService, RouteService, VesselInformation, NotifyService, VesselEvents) {
        $scope.state = {
            collapse: false,
            viewAll: true
        };
        $scope.routeLayer = null;//RouteLayerSingleton.getInstance();

        function initViewRoute(voyages) {
            if (voyages) {
                for (var index in voyages) {
                    if (voyages[index].route || index < voyages.length - 1) {
                        voyages[index].showRoute = {
                            value: false //$scope.routeLayer.containsVoyageRoute(voyages[index])
                        };
                    }
                }
            }
        }

        function loadSchedule() {
            if ($scope.mmsi) {
                ScheduleService.getSchedule($scope.mmsi, function (schedule) {
                    $scope.voyages = schedule.voyages.slice();
                    initViewRoute($scope.voyages);
                    $scope.checkAll();
                });
            }
        }


        $scope.provider = {
            doShow: false,
            title: "Schedule",
            type: "view",
            available: function (vesselOverview, vesselDetails) {
                return vesselDetails.additionalInformation.schedule;
            },
            show: function (vesselOverview, vesselDetails) {
                this.doShow = true;
                $scope.state.collapse = false;
                $scope.mmsi = vesselDetails.mmsi;
                $scope.activeRouteId = vesselDetails.additionalInformation.routeId;
                loadSchedule();
            },
            shown: function (vo, vd) {
                return this.doShow && !$scope.state.collapse;
            },
            close: function () {
                this.doShow = false;
            },
            hideAll: function () {
                return true;

            }
        };

        VesselInformation.addInformationProvider($scope.provider);
        $scope.close = function ($event) {
            $event.preventDefault();
            $scope.provider.close();
        };

        $scope.isActive = function (voyage) {
            if (!voyage || !voyage.route || !voyage.route.id) {
                return false;
            }

            if (!$scope.activeRouteId) {
                return false;
            }

            return $scope.activeRouteId === voyage.route.id;
        };

        $scope.formatLatitude = function (latitude) {
            return formatLatitude(latitude);
        };

        $scope.formatLongitude = function (latitude) {
            return formatLongitude(latitude);
        };

        $scope.formatDateTime = function (timeInMillis) {
            return formatTime(timeInMillis);
        };

        $scope.toggleViewAll = function () {
            $scope.checkAll();
            $scope.state.viewAll = !$scope.state.viewAll;
            for (var i in $scope.voyages) {
                if ($scope.voyages[i].showRoute) {
                    $scope.voyages[i].showRoute.value = $scope.state.viewAll;
                }
            }
        };

        $scope.checkAll = function () {
            for (var i in $scope.voyages) {
                if ($scope.voyages[i].showRoute && !$scope.voyages[i].showRoute.value) {
                    $scope.state.viewAll = false;
                    return;
                }
            }
            $scope.state.viewAll = true;
        };

        $scope.view = function () {
            $scope.state.collapse = true;

            var index;
            for (index in $scope.voyages) {
                var voyage = $scope.voyages[index];
                if (voyage.showRoute && !voyage.showRoute.value) {
                    // $scope.routeLayer.removeVoyageRoute(voyage);
                    if (voyage.route) {
                        RouteService.removeSelection(voyage.route);
                    }
                }
            }

            var routesToDraw = [];
            var routeIds = [];

            for (index = 0; index < $scope.voyages.length; index++) {
                var voyage = $scope.voyages[index];
                if (voyage.showRoute && voyage.showRoute.value) {
                    if (voyage.route) {
                        if ($scope.mmsi != embryo.authentication.shipMmsi
                            || voyage.route.id != $scope.activeRouteId) {
                            // do not display own active route again
                            routeIds.push(voyage.route.id);
                        }
                    } else if (index <= ($scope.voyages.length - 2)) {
                        routesToDraw.push({
                            own: $scope.mmsi == embryo.authentication.shipMmsi,
                            voyages: [voyage, $scope.voyages[index + 1]]
                        });
                    }
                }
            }
            if (routeIds.length > 0) {
                RouteService.getRoutes(routeIds, function (routes) {
                    for (var index in routes) {
                        var route = routes[index];
                        RouteService.addSelectedRoute(route);
                        route.own = $scope.mmsi == embryo.authentication.shipMmsi;
                        route.active = route.id == $scope.activeRouteId;
                        routesToDraw.push(route);
                        NotifyService.notify(VesselEvents.ShowRoutes, routesToDraw);
                    }
                });
            } else {
                NotifyService.notify(VesselEvents.ShowRoutes, routesToDraw);
            }
        };
    }

    // This is where we implement the "infinite scrolling" part for large
    // datasets.
    // Usage: x-when-scrolled="loadMore()" <-- see that method for more info
    module.directive('whenScrolled', whenScrolled);

    function whenScrolled() {
        return {
            link: linkFn
        };

        function linkFn(scope, elm, attr) {
            var div = elm.parent().parent();
            var raw = div[0];
            div.bind('scroll', function () {
                if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                    scope.$apply(attr.whenScrolled);
                }
            });
        }
    }

})();
