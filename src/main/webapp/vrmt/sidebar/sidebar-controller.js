(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .controller("SidebarController", SidebarController);

    SidebarController.$inject = ['$scope', 'RiskAssessmentService', 'RouteService', 'ScheduleService', 'NotifyService', 'Events'];

    function SidebarController($scope, RiskAssessmentService, RouteService, ScheduleService, NotifyService, Events) {
        var vm = this;
        vm.monitorAndReportActive = false;
        vm.safetyMeasuresActive = false;
        vm.decisionMakingActive = false;
        vm.logOfMeasuresAndReportsActive = false;
        vm.hidden = false;
        vm.toggleVisibility = toggleVisibility;
        vm.configure = configure;
        vm.routeDropdownOpen = false;
        vm.routeDropdownClicked = routeDropdownClicked;
        vm.routeDropdownClose = routeDropdownClose;
        vm.showRouteChoices = showRouteChoices;
        vm.routeViews = [];
        vm.meta = {
            vesselName: $scope.mmsi,
            routeView: {id: null, name: null}
        };

        function RouteView(params) {
            var originalRoute = params.route ? params.route : params;
            this.name = originalRoute.name;
            this.from = originalRoute.dep;
            this.to = originalRoute.des;
            this.etaDep = originalRoute.etaDep ? moment(originalRoute.etaDep).format("YYYY-MM-DD") : null;
            this.routeId = originalRoute.id;
        }

        RouteView.prototype.choose = function () {
            vm.routeDropdownOpen = false;
            RouteService.getRoute(this.routeId, function (route) {
                RiskAssessmentService.updateCurrentRoute(route);
            });
        };

        function toggleVisibility() {
            vm.hidden = !vm.hidden;
        }

        function configure() {
            NotifyService.notify(Events.OpenAssessmentFactorEditor);
        }

        function routeDropdownClicked() {
            vm.routeDropdownOpen = !vm.routeDropdownOpen;
            if (vm.routeDropdownOpen) {
                vm.showRouteChoices()
            }
        }

        function routeDropdownClose() {
            vm.routeDropdownOpen = false;
        }

        function showRouteChoices() {
            ScheduleService.getYourSchedule($scope.mmsi, function (schedule) {
                vm.routeViews = schedule.voyages
                    .map(function (voyage) {
                        return voyage.route ? new RouteView(voyage) : null;
                    })
                    .filter(function (elem) {
                        return elem != null;
                    });
            }, function (error) {
                console.log(error);
            });
        }

        NotifyService.subscribe($scope, Events.RouteChanged, onRouteChange);
        function onRouteChange(event, newRoute) {
            vm.meta.routeView = new RouteView(newRoute);
        }

        NotifyService.subscribe($scope, Events.VesselLoaded, onVesselLoaded);
        function onVesselLoaded(event, newVessel) {
            vm.meta.vesselName = newVessel.aisVessel.name || $scope.mmsi;
        }
    }
})();