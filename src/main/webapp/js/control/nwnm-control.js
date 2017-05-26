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


        NWNMService.subscribe(function (error, messages) {
            if (error) {
                embryo.messagePanel.show({
                    text: error,
                    type: "error"
                });
            } else {
                $scope.unfilteredMmessages = messages;
                onStateChange();
            }
        });

        /**
         * Filter messages according to the currently chosen filter criteria.
         * @param messages unfiltered list of NW-NM messages
         */
        function filter(messages) {
            return messages.filter(function (msg) {
                return activeFilter(msg) && nwFilter(msg) && nmFilter(msg);
            })
        }

        function activeFilter(msg) {
            return !$scope.state.showOnlyActive || msg.isActive;
        }

        function nmFilter(msg) {
            return $scope.state.showNM || msg.mainType !== "NM";
        }

        function nwFilter(msg) {
            return $scope.state.showNW || msg.mainType !== "NW";
        }

        function onStateChange() {
            $scope.messages = filter($scope.unfilteredMmessages);
            nwnmLayer.draw($scope.messages);
        }

        /**
         * Called whenever messages are loaded from the server or any filter changes.
         */
        $scope.stateChanged = function() {
            onStateChange();
        };

        $scope.showMsg = function() {
            NWNMService.update();
        };

        /**
         * Add controller as lister to map select events
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
            var point = embryo.map.getCenterForGeoJsonFeature(msg.jsonFeatures[0]);
            embryo.map.setCenter(point.longitude, point.latitude, 8);
            nwnmLayer.select(msg);
        };

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
