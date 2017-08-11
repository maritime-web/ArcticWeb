(function () {
    "use strict";

    var module = angular.module('embryo.reporting.control', ['embryo.greenposService']);

    var greenposTypes = {
        "SP": "Sailing Plan",
        "FR": "Final",
        "PR": "Position",
        "DR": "Deviation"
    };

    module.controller("ReportingController", ['$scope', 'GreenposService', 'VesselService', 'NotifyService', 'VesselEvents',
        function ($scope, GreenposService, VesselService, NotifyService, VesselEvents) {
        $scope.reports = [];
        $scope.selectedReport = null;

        GreenposService.getLatest(function (reports) {
            var result = [];


            for (var index in reports) {
                result.push({
                    name: reports[index].name,
                    type: greenposTypes[reports[index].type],
                    ts: formatTime(reports[index].ts),
                    mmsi: reports[index].mmsi
                });
                $scope.reports = result;
            }
        });

        $scope.selectVessel = function ($event, report) {
            $event.preventDefault();

            $scope.selectedReport = report;

            var vessel = VesselService.getVessel(report.mmsi);
            if (vessel) {
                NotifyService.notify(VesselEvents.VesselSelected, vessel);
            }
        }

    }]);

}());
