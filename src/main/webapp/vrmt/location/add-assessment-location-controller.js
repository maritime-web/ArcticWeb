(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .controller("AssessmentLocationController", AssessmentLocationController)
        .controller("ModalInstanceCtrl", ModalInstanceCtrl);


    AssessmentLocationController.$inject = ['$scope', '$modal', 'RiskAssessmentLocationService', 'NotifyService', 'Events'];

    function AssessmentLocationController($scope, $modal, RiskAssessmentLocationService, NotifyService, Events) {

        NotifyService.subscribe($scope, Events.AddAssessmentLocation, onAddAssessmentLocation);
        function onAddAssessmentLocation(event, newAssessmentLocationEvent) {
            var modalInstance = $modal.open({
                templateUrl: "addAssessmentLocation",
                controller: 'ModalInstanceCtrl',
                resolve: {
                    event: function () {
                        return newAssessmentLocationEvent;
                    }
                }
            });

            modalInstance.result.then(function (locParam) {
                var route = locParam.route;
                if (route) {
                    locParam.lat = route.lat;
                    locParam.lon = route.lon;
                }
                var vessel = locParam.vessel;
                if (vessel) {
                    locParam.lat = vessel.ais.lat;
                    locParam.lon = vessel.ais.lon;
                    var override = vessel.override;
                    if (override && override.lat && override.lon) {
                        locParam.lat = override.lat;
                        locParam.lon = override.lon;
                    }
                }

                locParam.routeId = $scope.route.id;
                RiskAssessmentLocationService.createAssessmentLocation(locParam)
                    .then(function (location) {
                        NotifyService.notify(Events.AssessmentLocationCreated, location);
                    });
            }, function (dismissReason) {
                console.log("assessment Location dismissed with reason '" + dismissReason + "'");
            })
        }
    }

    ModalInstanceCtrl.$inject = ['$scope', '$modalInstance', 'event'];
    function ModalInstanceCtrl($scope, $modalInstance, event) {
        $scope.loc = event;
    }

})();