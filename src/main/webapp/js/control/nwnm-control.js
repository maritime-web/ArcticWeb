$(function() {

    var nwnmLayer;
    embryo.postLayerInitialization(function() {
        nwnmLayer = new NWNMLayer();
        addLayerToMap("nwnm", nwnmLayer, embryo.map);
    });

    var module = angular.module('embryo.nwnm.controllers', [ 'embryo.nwnm.service' ]);

    module.controller("NWNMControl", [ '$scope', 'NWNMService', function($scope, NWNMService) {
        $scope.unfilteredMmessages = [];
        $scope.messages = [];
        $scope.selected = {};
        $scope.state = {};
        $scope.state.showOnlyActive = false;
        $scope.state.showNW = true;
        $scope.state.showNM = false;


        /**
         * Subscribe to notifications on NW-NM message loading.
         */
        NWNMService.subscribe(function (error, messages) {
            if (error) {
                embryo.messagePanel.show({
                    text: error,
                    type: "error"
                });
            } else {
                $scope.unfilteredMmessages = messages;
                var state = NWNMService.getFilterState();
                if (state) {
                    $scope.state = state;
                }

                onStateChange();
            }
        });

        /**
         * Filter messages according to the currently chosen filter criteria.
         * @param messages unfiltered list of NW-NM messages
         */
        function filter(messages) {
            return messages.filter(function (msg) {
                return activeFilter(msg) && nwFilter(msg) && nmFilter(msg) && areaFilter(msg);
            });

            function activeFilter(msg) {
                return !$scope.state.showOnlyActive || msg.isActive;
            }

            function nmFilter(msg) {
                return $scope.state.showNM || msg.mainType !== "NM";
            }

            function nwFilter(msg) {
                return $scope.state.showNW || msg.mainType !== "NW";
            }

            function areaFilter(msg) {
                return msg.mainArea.mrn === $scope.state.showArea || !msg.mainArea.mrn;
            }
        }

        /**
         * Called whenever messages are loaded from the server or any filter changes.
         */
        $scope.stateChanged = function() {
            onStateChange();
        };

        $scope.$watch("state.showArea", function (oldVal, newVal) {
            if (oldVal !== newVal) {
                centerMapOnArea($scope.state.showArea);
            }
        });

        function onStateChange() {
            $scope.mainAreas = extractMainAreas();
            if (!$scope.state.showArea) {
                $scope.state.showArea = $scope.mainAreas[0].mrn;
            }

            NWNMService.setFilterState($scope.state);
            $scope.messages = filter($scope.unfilteredMmessages);
            nwnmLayer.draw($scope.messages);
        }

        function centerMapOnArea(showArea) {
            var areaCenters = [];
            areaCenters["urn:mrn:iho:country:dk"] = {longitude: 11, latitude: 55, zoom: 6};
            areaCenters["urn:mrn:iho:country:gl"] = {longitude: -44, latitude: 69, zoom: 4};
            areaCenters["urn:mrn:iho:country:fo"] = {longitude: -6, latitude: 62, zoom: 8};

            var arg = areaCenters[showArea];
            embryo.map.setCenter(arg.longitude, arg.latitude, arg.zoom);
        }

        function extractMainAreas() {
            var mrns = new Set();
            return $scope.unfilteredMmessages.map(function (m) {
                var area = null;
                if (m.areas && m.areas.length > 0) {
                    area = m.areas[0];
                    while (area.parent) {
                        area = area.parent;
                    }
                }
                return area;
            }).filter(function (area) {
                var mrn = area.mrn;
                if (mrns.has(mrn)) {
                    return false;
                } else {
                    mrns.add(mrn);
                    return true;
                }
            });
        }

        $scope.showMsg = function() {
            NWNMService.update();
        };

        /**
         * Add controller as listener to map select events
         */
        nwnmLayer.select("nwnm", function(msg) {
            $scope.selected.open = !!msg;
            $scope.selected.msg = msg;
            if (!$scope.$$phase) {
                $scope.$apply(function() {
                });
            }
        });

        $scope.formatDate = function(timeInMillis) {
            return formatDate(timeInMillis);
        };

        $scope.selectMsg = function(msg) {
            centerMapOn(msg);
            nwnmLayer.select(msg);
        };

        function centerMapOn(msg) {
            var point = embryo.map.getCenterForGeoJsonFeature(msg.jsonFeatures[0]);
            embryo.map.setCenter(point.longitude, point.latitude, 8);
        }
    } ]);

    /**
     * Displays trusted content
     */
    module.filter('toTrusted', ['$sce', function ($sce) {
        return function (value) {
            return $sce.trustAsHtml(value);
        };
    }]);

    /****************************************************************
     * Renders the message source + publication date (adapted from niord)
     ****************************************************************/
    module.directive('renderMessageSource', [
        function () {

            return {
                restrict: 'E',
                template: '<span class="message-source">{{source}}</span>',
                scope: {
                    msg: "="
                },
                link: function(scope) {

                    scope.source = '';

                    scope.updateSource = function () {
                        scope.source = '';

                        if (scope.msg) {
                            var desc = scope.msg.descs[0];
                            if (desc && desc.source) {
                                scope.source = desc.source;
                            }
                            if (scope.msg.publishDateFrom &&
                                (scope.msg.status === 'PUBLISHED' || scope.msg.status === 'EXPIRED' || scope.msg.status === 'CANCELLED')) {
                                if (scope.source.length > 0) {
                                    if (scope.source.charAt(scope.source.length-1) !== '.') {
                                        scope.source += ".";
                                    }
                                    scope.source += " ";
                                }

                                scope.source += "Published"
                                    + " " + moment(scope.msg.publishDateFrom).format("D MMMM YYYY");
                            }
                        }
                    };

                    scope.$watch("[msg.descs, msg.publishDateFrom]", scope.updateSource, true);
                }
            };
        }])

});
