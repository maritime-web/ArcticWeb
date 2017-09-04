(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .controller("AssessmentLocationController", AssessmentLocationController)
        .controller("ModalInstanceCtrl", ModalInstanceCtrl);


    AssessmentLocationController.$inject = ['$scope', '$modal', 'RiskAssessmentService', 'NotifyService', 'VrmtEvents', 'growl'];

    function AssessmentLocationController($scope, $modal, RiskAssessmentService, NotifyService, VrmtEvents, growl) {

        NotifyService.subscribe($scope, VrmtEvents.AddRouteLocation, onAddAssessmentLocation);
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

                RiskAssessmentService.createRouteLocation(locParam)
                    .then(function (location) {
                        NotifyService.notify(VrmtEvents.RouteLocationCreated, location);
                    })
                    .catch(function (e) {
                        NotifyService.notify(VrmtEvents.AddRouteLocationDiscarded);
                        growl.warning(e.message);
                        console.log(e);
                });
            }, function (dismissReason) {
                console.log("assessment Location dismissed with reason '" + dismissReason + "'");
                console.log(dismissReason);
                NotifyService.notify(VrmtEvents.AddRouteLocationDiscarded);
            })
        }
    }

    ModalInstanceCtrl.$inject = ['$scope', '$modalInstance', 'event'];
    function ModalInstanceCtrl($scope, $modalInstance, event) {
        $scope.loc = event;
    }

})();