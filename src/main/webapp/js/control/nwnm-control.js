$(function() {

    var nwnmLayer;
    embryo.postLayerInitialization(function() {
        nwnmLayer = new NWNMLayer();
        addLayerToMap("nwnm", nwnmLayer, embryo.map);
    });

    var module = angular.module('embryo.nwnm.controllers', [ 'embryo.nwnm.service' ]);

    module.controller("NWNMLayerControl", [ '$scope', 'NWNMService', function($scope, NWNMService) {
        NWNMService.subscribe(function(error, warnings){
            if(error){
                embryo.messagePanel.show({
                    text: error,
                    type: "error"
                });
            }else{
                nwnmLayer.draw(warnings);
            }
        });
    } ]);

    module.controller("NWNMControl", [ '$scope', 'NWNMService', function($scope, NWNMService) {
        $scope.regions = [];
        $scope.warnings = [];
        $scope.selected = {};

        NWNMService.subscribe(function(error, warnings, regions, selectedRegions){
            for ( var x in regions) {
                if ($.inArray(regions[x].name, selectedRegions) != -1) {
                    regions[x].selected = true;
                }
            }
            $scope.regions = regions;
            $scope.warnings = warnings;
        });

        $scope.showMsi = function() {
            var regionNames = NWNMService.regions2Array($scope.regions);
            NWNMService.setSelectedRegions(regionNames);
            NWNMService.update();
        };

        nwnmLayer.select("nwnm", function(msi) {
            $scope.selected.open = !!msi;
            $scope.selected.msi = msi;
            if (!$scope.$$phase) {
                $scope.$apply(function() {
                });
            }
        });

        $scope.formatDate = function(timeInMillis) {
            return formatDate(timeInMillis);
        };

        $scope.selectMsi = function(msi) {
            switch (msi.type) {
            case "Point":
                embryo.map.setCenter(msi.points[0].longitude, msi.points[0].latitude, 8);
                break;
            case "Points":
            case "Polygon":
            case "Polyline":
                embryo.map.setCenter(msi.points[0].longitude, msi.points[0].latitude, 8);
                break;
            }
            nwnmLayer.select(msi);
        };
    } ]);

    /**
     * Displays trusted content
     */
    module.filter('toTrusted', ['$sce', function ($sce) {
        return function (value) {
            return $sce.trustAsHtml(value);
        };
    }]);

});
