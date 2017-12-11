(function () {
    angular
        .module('vrmt.app')
        .controller("MapController", MapController);

    MapController.$inject = ['$scope', 'RiskAssessmentService', 'NotifyService', 'VrmtEvents', 'growl'];

    function MapController($scope, RiskAssessmentService, NotifyService, VrmtEvents, growl) {
        var vm = this;

        vm.hide = true;
        vm.style = {position: "absolute", 'z-index': 200, top: 0, left: 0};
        vm.functions = [];
        vm.close = close;
        vm.vessel = null;
        vm.chosenRouteLocation = null;

        NotifyService.subscribe($scope, VrmtEvents.VesselLoaded, onVesselLoaded);
        function onVesselLoaded(event, loadedVessel) {
            vm.vessel = loadedVessel;
        }

        NotifyService.subscribe($scope, VrmtEvents.RouteLocationChosen, onRouteLocationChosen);
        function onRouteLocationChosen(event, chosen) {
            vm.chosenRouteLocation = chosen;
        }

        NotifyService.subscribe($scope, VrmtEvents.AssessmentUpdated, onCurrentAssessmentLoaded);
        function onCurrentAssessmentLoaded() {
            vm.functions = [];
            vm.functions.push(startNewAssessmentfunction);
        }

        NotifyService.subscribe($scope, VrmtEvents.AssessmentCompleted, onNoActiveAssessment);
        NotifyService.subscribe($scope, VrmtEvents.AssessmentDiscarded, onNoActiveAssessment);
        NotifyService.subscribe($scope, VrmtEvents.RouteLocationsLoaded, onNoActiveAssessment);
        function onNoActiveAssessment() {
            vm.functions = [];
            vm.functions.push(deleteRouteLocationFunction);
        }

        function close() {
            vm.hide = true;
        }

        var startNewAssessmentfunction =
        {
            name: 'New Assesment',
            choose: function () {
                vm.close();
                NotifyService.notify(VrmtEvents.OpenAssessmentEditor);
            }
        };

        var deleteRouteLocationFunction =
        {
            name: 'Delete',
            choose: function () {
                vm.close();
                var locationToDelete = vm.chosenRouteLocation;
                RiskAssessmentService.deleteRouteLocation(locationToDelete)
                    .then(function () {
                        growl.success("Assessment location successfully deleted");
                        NotifyService.notify(VrmtEvents.RouteLocationDeleted, locationToDelete);
                    }, function (errorReason) {
                        growl.error(errorReason.message);
                    });
            }
        };

        /**
         * Assessment location map functions
         */
        NotifyService.subscribe($scope, VrmtEvents.RouteLocationClicked, onAssessmentLocationClicked);
        function onAssessmentLocationClicked(event, details) {
            vm.style.top = details.y + "px";
            vm.style.left = details.x + "px";
            vm.hide = false;
            if (vm.functions.length === 0) {
                vm.functions.push(deleteRouteLocationFunction);
            }
        }

        /**
         * Vessel map functions
         */
        NotifyService.subscribe($scope, VrmtEvents.VesselClicked, onVesselClicked);
        function onVesselClicked(event, details) {
            vm.style.top = details.y + "px";
            vm.style.left = details.x + "px";
            vm.functions = [
                {
                    name: 'New Assesment location',
                    choose: function () {
                        vm.hide = true;
                        NotifyService.notify(VrmtEvents.AddRouteLocation, {
                            vessel: {
                                ais: {
                                    lon: vm.vessel.aisVessel.lon,
                                    lat: vm.vessel.aisVessel.lat
                                },
                                override: {}
                            }
                        });
                    }
                }

            ];
            vm.hide = false;
        }
    }
})();