$(function() {
    "use strict";

    var avpgLayer;
    //noinspection JSUnresolvedFunction
    embryo.postLayerInitialization(function() {
        avpgLayer = new AvpgLayer();
        addLayerToMap("avpg", avpgLayer, embryo.map);
    });

    var module = angular.module('embryo.avpg.control', ['ui.bootstrap.accordion', 'embryo.control', 'embryo.common.service', 'embryo.avpg.content.service', 'embryo.aton.service']);

    module.filter('startFrom', function() {
        return function(input, start) {
            start = +start;
            return input.slice(start);
        }
    });

    module.controller('AVPGTextViewCtrl', ['$scope', 'ViewService', 'AVPGContentService', '$log', function($scope, ViewService, AVPGContentService, $log) {
        $log.debug("Initializing AVPGTextViewCtrl");
        $scope.provider = {
            doShow: false,
            title: "Show something",
            type: "AVPG",
            content: AVPGContentService.getContentById("default"),
            show: function (textId) {
                if (textId) {
                    this.content = AVPGContentService.getContentById(textId);
                }
                this.doShow = true;
            },
            close: function () {
                this.doShow = false;
            }
        };
        ViewService.addViewProvider($scope.provider);

        $scope.close = function ($event) {
            $event.preventDefault();
            $scope.provider.close();
        };
    } ]);

    module.controller("AVPGController", ['$scope','ViewService', 'AtonService', '$log', '$timeout', function($scope, ViewService, AtonService, $log, $timeout){
        $log.debug("Initializing AVPGController");
        $scope.selected = {};
        $scope.lights = [];
        AtonService.getAtonData(function(atonData) {
            $scope.lights = atonData.sort(function(a, b) {return a.AFM_navn.trim().localeCompare(b.AFM_navn.trim());});
            $log.debug("Drawing " + $scope.lights.length + " lights");
            avpgLayer.draw($scope.lights);
            avpgLayer.show();
        });


        avpgLayer.select("avpg", function(avpg) {
            $timeout(function () {
                $scope.$apply(function () {
                    if (avpg != null) {
                        if (avpg.LONGITUDE) {
                            $log.debug("Selecting from map: " + avpg.LONGITUDE + ", " + avpg.LATITUDE);

                            $scope.selected.open = true;
                            $scope.selected.aton = avpg;
                            embryo.map.setCenter(avpg.LONGITUDE, avpg.LATITUDE, 15);
                        }
                    } else {
                        $scope.selected.open = false;
                        $scope.selected.aton = null;
                    }
                });
            }, 100);
        });

        $scope.currentPage = 0;
        $scope.pageSize = 4;

        $scope.numberOfPages = function(){
            return Math.ceil($scope.lights.length/$scope.pageSize);
        };

        var subscription = ViewService.subscribe({
            name: "AVPGController",
            onNewProvider: function () {
                var viewProvider = ViewService.viewProviders()['AVPG'];
                if (viewProvider) {
                    $log.debug("Found AVPG view provider");
                    $scope.avgpProvider = viewProvider;
                }
            }
        });

        $scope.$on("$destroy", function () {
            ViewService.unsubscribe(subscription);
            avpgLayer.hide();
        });

        $scope.viewText = function(textId, $event) {
            if (arguments.length !== 2) {
                throw "Illegal argument. viewText needs both a textId and an $event";
            }

            if (typeof textId !== 'string') {
                throw "Illegal argument. First argument should be a 'string' not " + typeof textId;
            }

            if ($scope.avgpProvider) {
                $scope.avgpProvider.show(textId);
            }

            $event.preventDefault();
        };

        $scope.selectLight = function(light, $event) {
            $event.preventDefault();
            $log.debug("Selecting: " + light.LONGITUDE + ", " + light.LATITUDE);
            embryo.map.setCenter(light.LONGITUDE, light.LATITUDE, 15);

            avpgLayer.select(light);
        };
    }]);

});
