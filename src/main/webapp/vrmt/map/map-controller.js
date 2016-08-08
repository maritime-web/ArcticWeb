(function () {
    angular
        .module('vrmt.app')
        .controller("MapController", MapController);

    MapController.$inject = ['$scope', 'MapService', 'RiskAssessmentService'];

    function MapController($scope, MapService, RiskAssessmentService) {
        var vm = this;

        vm.hide = true;
        vm.style = {position: "absolute", 'z-index': 200, top: 0, left: 0};
        vm.functions = [];
        vm.close = close;

        $scope.mapState = {};
        vm.mapBackgroundLayers = MapService.createStdBgLayerGroup();

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
                            $scope.editorActivator.showAssessmentEditor += 1;
                        }
                    },
                    {
                        name: 'Delete',
                        choose: function () {
                            vm.close();
                            var locationToDelete = $scope.assessmentLocationState['chosen'].location;
                            RiskAssessmentService.deleteAssessmentLocation(locationToDelete)
                                .then(function () {
                                    $scope.assessmentLocationEvents['deleted'] = locationToDelete;
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
                                        lon: $scope.vessel.aisVessel.lon,
                                        lat: $scope.vessel.aisVessel.lat
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