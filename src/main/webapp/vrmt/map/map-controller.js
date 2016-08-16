(function () {
    angular
        .module('vrmt.app')
        .controller("MapController", MapController);

    MapController.$inject = ['$scope', 'RiskAssessmentLocationService', 'NotifyService', 'Events'];

    function MapController($scope, RiskAssessmentLocationService, NotifyService, Events) {
        var vm = this;

        vm.hide = true;
        vm.style = {position: "absolute", 'z-index': 200, top: 0, left: 0};
        vm.functions = [];
        vm.close = close;
        vm.vessel = null;
        vm.chosenAssessment = null;

        NotifyService.subscribe($scope, Events.VesselLoaded, onVesselLoaded);
        function onVesselLoaded(event, loadedVessel) {
            vm.vessel = loadedVessel;
        }


        NotifyService.subscribe($scope, Events.AssessmentLocationChosen, onAssessmentLocationChosen);
        function onAssessmentLocationChosen(event, chosen) {
            vm.chosenAssessment = chosen;
        }

        function close() {
            vm.hide = true;
        }


        /**
         * Assessment location map functions
         */
        NotifyService.subscribe($scope, Events.AssessmentLocationClicked, onAssessmentLocationClicked);
        function onAssessmentLocationClicked(event, details) {
            vm.style.top = details.y + "px";
            vm.style.left = details.x + "px";
            vm.functions = [
                {
                    name: 'New Assesment',
                    choose: function () {
                        vm.close();
                        NotifyService.notify(Events.OpenAssessmentEditor);
                    }
                },
                {
                    name: 'Delete',
                    choose: function () {
                        vm.close();
                        var locationToDelete = vm.chosenAssessment.location;
                        RiskAssessmentLocationService.deleteAssessmentLocation(locationToDelete)
                            .then(function () {
                                NotifyService.notify(Events.AssessmentLocationDeleted, locationToDelete);
                            }, function (errorReason) {
                                console.log(errorReason);
                            });
                    }
                }

            ];
            vm.hide = false;
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
                        NotifyService.notify(Events.AddAssessmentLocation, {
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