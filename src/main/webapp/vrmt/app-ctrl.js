
angular.module('vrmt.app')

    .controller("AppController", ['$scope', '$http', '$window', '$timeout', 'MapService',
        function ($scope, $http, $window, $timeout, MapService) {
            /* sidebar control */
            $scope.sidebar = {
                monitorAndReportActive: false,
                safetyMeasuresActive: false,
                decisionMakingActive: false,
                logOfMeasuresAndReportsActive: false,
                hidden: false,
                toggleVisibility: function () {
                    this.hidden = !this.hidden;
                }
            };
            
            /* timeline control */
            $scope.timeline = {
                hidden: false
            };
            $scope.choosenTime = 0;
            $scope.times = [];
            $scope.calculatedIndexes = createTimelineSegments();
            $scope.timelineDimensions = createDimensions();

            var offset = $scope.timelineDimensions.offset;
            var distanceBetween = 20;
            var width = $scope.timelineDimensions.width;
            for (var i = 0; (i*distanceBetween + offset) < (width - offset); i++) {
                $scope.times[i] = {
                    x1: i*distanceBetween + offset
                };
            }

            $scope.moveVessel = function ($event) {
                $event.preventDefault();
                $scope.choosenTime = $event.offsetX;
            }
            
            // Map state and layers
            $scope.mapState = {};
            $scope.mapBackgroundLayers = MapService.createStdBgLayerGroup();
            $scope.mapWeatherLayers = MapService.createStdWeatherLayerGroup();
            $scope.mapMiscLayers = MapService.createStdMiscLayerGroup();
            
        }]);

function createTimelineSegments() {
    return [
        {
            color: "#FFFF00",
            x1: 0,
            x2: 100,
            y1: 100,
            y2: 100
        },
        {
            color: "#FFFF00",
            x1: 100,
            x2: 100,
            y1: 100,
            y2: 150
        },
        {
            color: "#00FF00",
            x1: 100,
            x2: 200,
            y1: 150,
            y2: 150
        },
        {
            color: "#00FF00",
            x1: 200,
            x2: 200,
            y1: 150,
            y2: 50
        },
        {
            color: "#FF0000",
            x1: 200,
            x2: 300,
            y1: 50,
            y2: 50
        }
    ];

}

function indexToPixels(baseline, index, maxIndex) {
    return (baseline/maxIndex) * index;
}

function createDimensions() {
    var d = {};
    d.width = 600;
    d.height = 250;
    d.offset = 1;
    d.baseline = d.height - 30;
    d.yellowThreshold = indexToPixels(d.baseline, 1000, 3000);
    d.redThreshold = indexToPixels(d.baseline, 2000, 3000);
    return d;
}