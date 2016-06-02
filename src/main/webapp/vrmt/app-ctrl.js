
angular.module('vrmt.app')

    .controller("AppController", ['$scope', '$http', '$window', '$timeout', 'MapService',
        function ($scope, $http, $window, $timeout, MapService) {

            $scope.sidebar = {
                monitorAndReportActive: false,
                safetyMeasuresActive: false,
                decisionMakingActive: false,
                logOfMeasuresAndReportsActive: false
            };
            
            // Map state and layers
            $scope.mapState = {};
            $scope.mapBackgroundLayers = MapService.createStdBgLayerGroup();
            $scope.mapWeatherLayers = MapService.createStdWeatherLayerGroup();
            $scope.mapMiscLayers = MapService.createStdMiscLayerGroup();
            //$scope.mapTrafficLayers = ""; // is set in the ais-vessel-layer

            // Alerts
            $scope.alerts = [
                {type: 'success', msg: 'Welcome to ArcticWeb', timeout: 3000}
            ];

            /** Closes the alert at the given index */
            $scope.closeAlert = function (index) {
                $scope.alerts.splice(index, 1);
            };


            /** Toggle the selected status of the layer **/
            $scope.toggleLayer = function(layer) {
                (layer.getVisible() == true) ? layer.setVisible(false) : layer.setVisible(true); // toggle layer visibility
                if(layer.getVisible()){
                    $scope.alerts.push({
                        msg: 'Activating ' + layer.get('title') + ' layer',
                        type: 'info',
                        timeout: 3000
                    });
                }
            };

            /** Toggle the selected status of the service **/
            $scope.switchBaseMap = function(basemap) {
                //console.log('Switching BaseMap');
                // disable every basemaps
                angular.forEach($scope.mapBackgroundLayers.getLayers().getArray(), function(value){
                   // console.log("disabling " + value.get('title'));
                    value.setVisible(false)
                });
                basemap.setVisible(true);// activate selected basemap

                $scope.alerts.push({
                    msg: 'Activating map ' + basemap.get('title') ,
                    type: 'info',
                    timeout: 3000
                });
            };
            
        }]);
