(function () {
    angular
        .module('vrmt.app')
        .controller("MapController", MapController);

    MapController.$inject = ['$scope', 'MapService', 'RiskAssessmentLocationService', 'NotifyService', 'Events'];

    function MapController($scope, MapService, RiskAssessmentLocationService, NotifyService, Events) {
        var vm = this;

        vm.hide = true;
        vm.style = {position: "absolute", 'z-index': 200, top: 0, left: 0};
        vm.functions = [];
        vm.close = close;
        vm.vessel = null;
        vm.chosenAssessment = null;

        $scope.mapState = {};
        vm.mapBackgroundLayers = MapService.createStdBgLayerGroup();


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
        $scope.$watch("assessmentLocationState['locationClick']", function (newValue, oldValue) {
            if (newValue && newValue !== oldValue) {
                vm.style.top = newValue.y + "px";
                vm.style.left = newValue.x + "px";
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
        });

        /**
         * Vessel map functions
         */
        $scope.$watch("mapState['vesselClick']", function (newValue, oldValue) {
            if (newValue && newValue !== oldValue) {
                vm.style.top = newValue.y + "px";
                vm.style.left = newValue.x + "px";
                vm.functions = [
                    {
                        name: 'New Assesment location',
                        choose: function () {
                            vm.hide = true;
                            $scope.assessmentLocationState['new'] = {
                                vessel: {
                                    ais: {
                                        lon: vm.vessel.aisVessel.lon,
                                        lat: vm.vessel.aisVessel.lat
                                    },
                                    override: {}
                                }
                            }
                        }
                    }

                ];
                vm.hide = false;
            }
        });
    }
})();