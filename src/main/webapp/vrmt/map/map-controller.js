(function () {
    angular
        .module('vrmt.app')
        .controller("MapController", MapController);

    MapController.$inject = ['$scope', 'RiskAssessmentService', 'NotifyService', 'Events'];

    function MapController($scope, RiskAssessmentService, NotifyService, Events) {
        var vm = this;

        vm.hide = true;
        vm.style = {position: "absolute", 'z-index': 200, top: 0, left: 0};
        vm.functions = [];
        vm.close = close;
        vm.vessel = null;
        vm.chosenRouteLocation = null;

        NotifyService.subscribe($scope, Events.VesselLoaded, onVesselLoaded);
        function onVesselLoaded(event, loadedVessel) {
            vm.vessel = loadedVessel;
        }

        NotifyService.subscribe($scope, Events.RouteLocationChosen, onRouteLocationChosen);
        function onRouteLocationChosen(event, chosen) {
            vm.chosenRouteLocation = chosen;
        }

        NotifyService.subscribe($scope, Events.AssessmentUpdated, onCurrentAssessmentLoaded);
        function onCurrentAssessmentLoaded() {
            vm.functions = [];
            vm.functions.push(startNewAssessmentfunction);
        }

        NotifyService.subscribe($scope, Events.AssessmentCompleted, onNoActiveAssessment);
        NotifyService.subscribe($scope, Events.AssessmentDiscarded, onNoActiveAssessment);
        NotifyService.subscribe($scope, Events.RouteLocationsLoaded, onNoActiveAssessment);
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
                NotifyService.notify(Events.OpenAssessmentEditor);
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
                        NotifyService.notify(Events.RouteLocationDeleted, locationToDelete);
                    }, function (errorReason) {
                        console.log(errorReason);
                    });
            }
        };

        /**
         * Assessment location map functions
         */
        NotifyService.subscribe($scope, Events.RouteLocationClicked, onAssessmentLocationClicked);
        function onAssessmentLocationClicked(event, details) {
            vm.style.top = details.y + "px";
            vm.style.left = details.x + "px";
            vm.hide = false;
            if (vm.functions.length == 0) {
                vm.functions.push(deleteRouteLocationFunction);
            }
        }

        /**
         * Vessel map functions
         */
        NotifyService.subscribe($scope, Events.VesselClicked, onVesselClicked);
        function onVesselClicked(event, details) {
            vm.style.top = details.y + "px";
            vm.style.left = details.x + "px";
            vm.functions = [
                {
                    name: 'New Assesment location',
                    choose: function () {
                        vm.hide = true;
                        NotifyService.notify(Events.AddRouteLocation, {
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