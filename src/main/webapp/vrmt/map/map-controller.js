angular.module('vrmt.app')
    .controller("MapController", ['$scope', 'MapService', 'RiskAssessmentService', function ($scope, MapService, RiskAssessmentService) {
        // Map state and layers
        $scope.mapState = {};
        $scope.mapBackgroundLayers = MapService.createStdBgLayerGroup();

        /**
         * Context function control structure
         */
        $scope.contextFunctions = {
            hide: true,
            style: {position: "absolute", 'z-index': 200, top: 0, left: 0},
            functions: [],
            close: function () {
                this.hide = true;
            }
        };

        /**
         * Assessment location map functions
         */
        $scope.$watch("assessmentLocationState['locationClick']", function (newValue, oldValue) {
            if (newValue && newValue !== oldValue) {
                $scope.contextFunctions.style.top = newValue.y + "px";
                $scope.contextFunctions.style.left = newValue.x + "px";
                $scope.contextFunctions.functions = [
                    {
                        name: 'New Assesment',
                        choose: function () {
                            $scope.contextFunctions.close();
                            $scope.editorActivator.showAssessmentEditor += 1;
                        }
                    },
                    {
                        name: 'Delete',
                        choose: function () {
                            $scope.contextFunctions.close();
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
                $scope.contextFunctions.hide = false;
            }
        });

        /**
         * Vessel map functions
         */
        $scope.$watch("mapState['vesselClick']", function (newValue, oldValue) {
            if (newValue && newValue !== oldValue) {
                $scope.contextFunctions.style.top = newValue.y + "px";
                $scope.contextFunctions.style.left = newValue.x + "px";
                $scope.contextFunctions.functions = [
                    {
                        name: 'New Assesment location',
                        choose: function () {
                            $scope.contextFunctions.hide = true;
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
                $scope.contextFunctions.hide = false;
            }
        });
    }]);
