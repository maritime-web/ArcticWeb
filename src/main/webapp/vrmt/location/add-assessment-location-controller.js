(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .controller("AssessmentLocationController", AssessmentLocationController)
        .controller("ModalInstanceCtrl", ModalInstanceCtrl);


    AssessmentLocationController.$inject = ['$scope', '$modal', 'RiskAssessmentLocationService'];

    function AssessmentLocationController($scope, $modal, RiskAssessmentLocationService) {
        $scope.$watch("assessmentLocationState['new']", function (newAssessmentLocationEvent, oldAssessmentLocationEvent) {
            if (!newAssessmentLocationEvent || newAssessmentLocationEvent == oldAssessmentLocationEvent) return;

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
                        $scope.assessmentLocationEvents['created'] = location;
                    });
            }, function (dismissReason) {
                console.log("assessment Location dismissed with reason '" + dismissReason + "'");
            })
        });
    }

    ModalInstanceCtrl.$inject = ['$scope', '$modalInstance', 'event'];
    function ModalInstanceCtrl($scope, $modalInstance, event) {
        $scope.loc = event;
    }

})();