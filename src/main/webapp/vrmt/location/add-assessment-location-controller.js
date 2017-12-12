(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .controller("AssessmentLocationController", AssessmentLocationController)
        .controller("ModalInstanceCtrl", ModalInstanceCtrl);


    AssessmentLocationController.$inject = ['$scope', '$uibModal', 'RiskAssessmentService', 'NotifyService', 'VrmtEvents', 'growl'];

    function AssessmentLocationController($scope, $uibModal, RiskAssessmentService, NotifyService, VrmtEvents, growl) {

        var create = function (locParam) {
            RiskAssessmentService.createRouteLocation(locParam)
                .then(function (location) {
                    growl.success("Assessment location successfully created");
                    NotifyService.notify(VrmtEvents.RouteLocationCreated, location);
                })
                .catch(function (e) {
                    NotifyService.notify(VrmtEvents.AddRouteLocationDiscarded);
                    growl.warning(e.message);
                    console.log(e);
                });
        };

        var edit = function (locParam) {
            RiskAssessmentService.editRouteLocation(locParam)
                .then(function (location) {
                    growl.success("Assessment location '"+location.name+"' successfully saved");
                })
                .catch(function (e) {
                    growl.error(e.message);
                    console.log(e);
                });
        };

        NotifyService.subscribe($scope, VrmtEvents.AddRouteLocation, onAddAssessmentLocation);
        NotifyService.subscribe($scope, VrmtEvents.EditRouteLocation, onAddAssessmentLocation);

        function onAddAssessmentLocation(event, newAssessmentLocationEvent) {
            if (!newAssessmentLocationEvent.route && !newAssessmentLocationEvent.vessel) {
                newAssessmentLocationEvent.route = {
                    lon: newAssessmentLocationEvent.lon,
                    lat: newAssessmentLocationEvent.lat
                }
            }
            var modalInstance = $uibModal.open({
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

                if (event.name === VrmtEvents.AddRouteLocation) {
                    create(locParam);
                } else if (event.name === VrmtEvents.EditRouteLocation) {
                    edit(locParam);
                }
            }, function (dismissReason) {
                console.log("assessment Location dismissed with reason '" + dismissReason + "'");
                console.log(dismissReason);
                NotifyService.notify(VrmtEvents.AddRouteLocationDiscarded);
            })


        }
    }

    ModalInstanceCtrl.$inject = ['$scope', '$uibModalInstance', 'event'];

    function ModalInstanceCtrl($scope, $uibModalInstance, event) {
        $scope.loc = event;
    }

})();