$(function() {
    "use strict";

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

    module.controller("AVPGController", ['$scope','ViewService', '$log', function($scope, ViewService, $log){
        $log.debug("Initializing AVPGController");

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
        }
    }]);

});
