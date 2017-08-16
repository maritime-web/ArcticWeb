(function () {
    'use strict';

    angular
        .module('embryo.vessel.map')
        .directive('vesselZoom', vessel);

    vessel.$inject = ['Subject', 'OpenlayerService', 'NotifyService', 'OpenlayerEvents'];

    function vessel(Subject, OpenlayerService, NotifyService, OpenlayerEvents) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'vessel/map/vessel-zoom-template.html',
            scope: {},
            controller: ['$scope', controllerFn],
            link: linkFn
        };

        function controllerFn($scope) {
            $scope.zoomAllArctic = function () {
                var data = {
                    center: OpenlayerService.getArcticCenter(),
                    resolution: OpenlayerService.maxResolution
                };
                NotifyService.notify(OpenlayerEvents.OpenlayerZoomAndCenter, data);
            };

            $scope.zoomMyVessel = function () {
                var myMmsi = Subject.getDetails().shipMmsi;
                var data = {
                    id: myMmsi,
                    resolution: 2000
                };
                NotifyService.notify(OpenlayerEvents.OpenlayerZoomToFeature, data);
            }

        }

        function linkFn(scope, element, attrs, ctrl) {

        }
    }
})();