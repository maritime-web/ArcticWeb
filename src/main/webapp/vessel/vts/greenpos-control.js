(function () {
    "use strict";

    var module = angular.module('embryo.vessel.vts');

    module.controller("ReportingController", ReportingController);
    ReportingController.$inject = ['$scope', 'GreenposService', 'VesselService', 'NotifyService', 'VesselEvents'];

    function ReportingController($scope, GreenposService, VesselService, NotifyService, VesselEvents) {
        $scope.reports = [];
        $scope.selectedReport = null;

        var greenposTypes = {
            "SP": "Sailing Plan",
            "FR": "Final",
            "PR": "Position",
            "DR": "Deviation"
        };

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

    }

})();
