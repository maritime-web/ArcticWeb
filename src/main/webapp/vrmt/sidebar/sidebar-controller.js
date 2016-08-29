(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .controller("SidebarController", SidebarController);

    SidebarController.$inject = ['$scope', 'RouteService', 'ScheduleService', 'NotifyService', 'Events'];

    function SidebarController($scope, RouteService, ScheduleService, NotifyService, Events) {
        var vm = this;
        vm.assessActive = false;
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
            routeView: {id: null, name: null},

        };

        function RouteView(params) {
            this.name = params.route.name;
            this.routeId = params.route.id;
        }

        RouteView.prototype.choose = function () {
            vm.routeDropdownOpen = false;
            RouteService.getRoute(this.routeId, function (route) {
                NotifyService.notify(Events.RouteChanged, route);
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
            vm.meta.routeView = {id: newRoute.id, name: newRoute.name};
        }

        NotifyService.subscribe($scope, Events.VesselLoaded, onVesselLoaded);
        function onVesselLoaded(event, newVessel) {
            vm.meta.vesselName = newVessel.aisVessel.name || $scope.mmsi;
        }
    }
})();