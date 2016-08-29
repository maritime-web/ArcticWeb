(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .controller("AssessController", AssessController);

    AssessController.$inject = ['$scope', 'RouteLocationService', 'RiskAssessmentService', 'NotifyService', 'Events'];

    function AssessController($scope, RouteLocationService, RiskAssessmentService, NotifyService, Events) {
        var vm = this;
        vm.currentLocationAssessment = null;
        vm.assessmentViews = [];
        vm.startNew = startNew;
        vm.save = save;
        vm.discard = discard;
        var currentRoute = null;


        function startNew() {
            RiskAssessmentService.startNewAssessment(currentRoute)
                .then(function (currentAssessment) {
                    NotifyService.notify(Events.NewAssessmentStarted, currentAssessment);
                })
                .catch(function (e) {
                    console.log(e);
                });
        }

        function save() {
            RiskAssessmentService.endAssessment(currentRoute.id)
                .then(function () {
                    NotifyService.notify(Events.AssessmentCompleted);
                })
                .catch(function (e) {
                    console.log(e);
                });
        }

        function discard() {
            RiskAssessmentService.discardAssessment(currentRoute.id)
                .then(function () {
                    NotifyService.notify(Events.AssessmentDiscarded);
                })
                .catch(function (e) {
                    console.log(e);
                });
        }

        function LocationAssessmentView(assessment) {
            this.assessment = assessment;
            this.location = assessment.location;
            this.locationId = assessment.location.id;
            this.locationName = assessment.location.id + '. ' + assessment.location.name;
            this.index = assessment.index || '-';
            this.factorAssessments = assessment.scores || [];

            this.newAssessment = function () {
                NotifyService.notify(Events.RouteLocationChosen, this.location);
                NotifyService.notify(Events.OpenAssessmentEditor);
            };

            this.deleteLocation = function () {
                var locationToDelete = this.location;
                RouteLocationService.deleteRouteLocation(locationToDelete)
                    .then(function () {
                        NotifyService.notify(Events.RouteLocationDeleted, locationToDelete);
                    }, function (errorReason) {
                        console.log(errorReason);
                    });
            };

            this.choose = function () {
                NotifyService.notify(Events.RouteLocationChosen, this.location);
            }
        }

        NotifyService.subscribe($scope, Events.AssessmentCompleted, handleNoCurrentAssessment);
        NotifyService.subscribe($scope, Events.AssessmentDiscarded, handleNoCurrentAssessment);
        function handleNoCurrentAssessment() {
            vm.assessmentViews = [];
            vm.currentLocationAssessment = null;

        }

        NotifyService.subscribe($scope, Events.NewAssessmentStarted, onCurrentAssessmentLoaded);
        NotifyService.subscribe($scope, Events.AssessmentUpdated, onCurrentAssessmentLoaded);
        function onCurrentAssessmentLoaded(event, currentAssessment) {
            vm.assessmentViews = [];
            vm.currentLocationAssessment = null;
            var routeLocations = currentAssessment.locationsToAssess;
            routeLocations.sort(byEta);
            routeLocations.forEach(function (routeLocation) {
                var locationAssessment = currentAssessment.getLocationAssessment(routeLocation.id);
                var assessmentView = new LocationAssessmentView(locationAssessment);
                vm.assessmentViews.push(assessmentView);
            });
        }

        function byEta(a, b) {
            if (moment(a.eta).isAfter(b.eta)) {
                return -1;
            } else if (moment(a.eta).isSame(b.eta)) {
                return 0;
            } else {
                return 1;
            }
        }

        NotifyService.subscribe($scope, Events.RouteLocationChosen, onRouteLocationChosen);
        function onRouteLocationChosen(event, chosen) {
            vm.currentLocationAssessment = getViewForRouteLocation(chosen);
        }

        function getViewForRouteLocation(routeLocation) {
            return vm.assessmentViews.find(function (view) {
                return view.locationId === routeLocation.id;
            })
        }

        NotifyService.subscribe($scope, Events.RouteChanged, onRouteChange);
        function onRouteChange(event, newRoute) {
            currentRoute = newRoute;
        }
    }

})();
