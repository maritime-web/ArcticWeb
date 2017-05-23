$(function() {

    var nwnmLayer;
    embryo.postLayerInitialization(function() {
        nwnmLayer = new NWNMLayer();
        addLayerToMap("nwnm", nwnmLayer, embryo.map);
    });

    var module = angular.module('embryo.nwnm.controllers', [ 'embryo.nwnm.service' ]);

    module.controller("NWNMLayerControl", [ '$scope', 'NWNMService', function($scope, NWNMService) {
        NWNMService.subscribe(function(error, messages){
            if(error){
                embryo.messagePanel.show({
                    text: error,
                    type: "error"
                });
            }else{
                nwnmLayer.draw(messages);
            }
        });
    } ]);

    module.controller("NWNMControl", [ '$scope', 'NWNMService', function($scope, NWNMService) {
        $scope.regions = [];
        $scope.messages = [];
        $scope.selected = {};

        NWNMService.subscribe(function(error, messages, regions, selectedRegions){
            for ( var x in regions) {
                if ($.inArray(regions[x].name, selectedRegions) != -1) {
                    regions[x].selected = true;
                }
            }
            $scope.regions = regions;
            $scope.messages = messages;
        });

        $scope.showMsg = function() {
            var regionNames = NWNMService.regions2Array($scope.regions);
            NWNMService.setSelectedRegions(regionNames);
            NWNMService.update();
        };

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
