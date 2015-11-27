$(function() {
    "use strict";

    var avpgLayer;
    //noinspection JSUnresolvedFunction
    embryo.postLayerInitialization(function() {
        avpgLayer = new AvpgLayer();
        addLayerToMap("avpg", avpgLayer, embryo.map);
    });

    var module = angular.module('embryo.avpg.control', ['ui.bootstrap.accordion', 'embryo.control', 'embryo.common.service', 'embryo.avpg.content.service']);

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

    module.controller("AVPGController", ['$scope','ViewService', '$log', '$timeout', function($scope, ViewService, $log, $timeout){
        $log.debug("Initializing AVPGController");
        $scope.selected = {};
        $scope.selected.light = "No light selected";
        $scope.lights = [
            {point:{longitude: "-44,2873153686523", latitude: "60,1464042663574"}, description: "Aappilattoq."},
            {point:{longitude: "-51,7156524658203", latitude: "64,1723327636718"}, description: "Nuuk (Godthåb) Umiarsualivik (Skibshavn Indsejling)."},
            {point:{longitude: "-53,6867485046386", latitude: "66,5072174072265"}, description: "Qeqertarssuatsiaq."},
            {point:{longitude: "-53,4676933288574", latitude: "68,3056106567382"}, description: "Kangâtsiaq."},
            {point:{longitude: "-37,5680198669433", latitude: "65,5850296020507"}, description: "Ammassalik Ydre."},
            {point:{longitude: "-56,1402015686035", latitude: "72,7894439697265"}, description: "Upernavik Bagfyr."},
            {point:{longitude: "-52,1226806640625", latitude: "70,6758728027343"}, description: "Umanak Havn Forfyr."},
            {point:{longitude: "-51,085823059082", latitude: "69,2185745239257"}, description: "Ilulissat (Jakobs) Havn Indre Forfyr."},
            {point:{longitude: "-51,2059211730957", latitude: "68,813720703125"}, description: "Qasigiannguit (Christianshåb) Ankermærke Forfyr."},
            {point:{longitude: "-52,8859329223632", latitude: "68,7122726440429"}, description: "Ræveø Tværmærke Forfyr."},
            {point:{longitude: "-45,2307968139648", latitude: "60,1304321289062"}, description: "Nanortalik Bagfyr."}
        ];
        avpgLayer.draw($scope.lights);

        avpgLayer.select("avpg", function(avpg) {
            $timeout(function () {
                $scope.$apply(function () {
                    if (avpg) {
                        $scope.selected.light = avpg.description + " coords: [" + avpg.point.longitude + ", " + avpg.point.latitude + "]";
                        embryo.map.setCenter(avpg.point.longitude, avpg.point.latitude, 8);
                    }
                });
            }, 200);
        });


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
            embryo.map.setCenter(light.point.longitude, light.point.latitude, 8);
            avpgLayer.select(light);
        };
    }]);

});
