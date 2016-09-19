(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .controller("AssessController", AssessController);

    AssessController.$inject = ['$scope', 'RiskAssessmentService', 'NotifyService', 'Events', 'growl'];

    function AssessController($scope, RiskAssessmentService, NotifyService, Events, growl) {
        var vm = this;
        vm.active = false;
        vm.currentLocationAssessment = null;
        vm.assessmentStartedAt = null;
        vm.assessmentViews = [];
        vm.startNew = startNew;
        vm.save = save;
        vm.discard = discard;
        vm.assessing = false;
        var currentRoute = null;
        var vessel = null;
        var unSubscribeRouteLocationCreated = null;

        function startNew() {
            unSubscribeRouteLocationCreated = NotifyService.subscribe($scope, Events.RouteLocationCreated, function () {
                RiskAssessmentService.startNewAssessment()
                    .then(function (currentAssessment) {
                        growl.info("Started new risk assesssment");
                        NotifyService.notify(Events.NewAssessmentStarted, currentAssessment);
                    })
                    .catch(function (e) {
                        growl.error("<p>Unable to start new risk assessment:</p>" + e.message);
                        console.log(e);
                    });
                onAddRouteLocationFinished();
            });

            console.log(moment(vessel.aisVessel.lastReport));
            console.log(moment().from(vessel.aisVessel.lastReport));
            console.log(moment().to(vessel.aisVessel.lastReport));
            var addRouteLocationEvent = {
                introduction: "Before the new assessment can start you need to create a new assessment location on your vessels current position. Please override the given ais position if it isn't correct. The ais position was last recieved " + moment().to(vessel.aisVessel.lastReport),
                vessel: {
                    ais: vessel ? vessel.aisVessel : {},
                    override: vessel ? Object.assign({}, vessel.aisVessel) : {}
                }
            };

            NotifyService.notify(Events.AddRouteLocation, addRouteLocationEvent)
        }

        function save() {
            RiskAssessmentService.endAssessment()
                .then(function () {
                    growl.info("Risk assessment saved");
                    NotifyService.notify(Events.AssessmentCompleted);
                })
                .catch(function (e) {
                    growl.error(e.message);
                    console.log(e);
                });
        }

        function discard() {
            RiskAssessmentService.discardAssessment()
                .then(function () {
                    growl.info("Risk assessment discarded");
                    NotifyService.notify(Events.AssessmentDiscarded);
                })
                .catch(function (e) {
                    growl.error(e.message);
                    console.log(e);
                });
        }

        function LocationAssessmentView(assessment) {
            this.assessment = assessment;
            this.location = assessment.location;
            this.locationId = assessment.location.id;
            this.locationName = assessment.location.name || "unnamed";
            this.index = assessment.index || '-';
            this.factorAssessments = assessment.scores || [];

            this.newAssessment = function () {
                NotifyService.notify(Events.RouteLocationChosen, this.location);
                NotifyService.notify(Events.OpenAssessmentEditor);
            };

            this.deleteLocation = function () {
                var locationToDelete = this.location;
                RiskAssessmentService.deleteLocation(locationToDelete.id)
                    .then(function (updatedAssessment) {
                        NotifyService.notify(Events.AssessmentUpdated, updatedAssessment);
                    });
            };

            this.choose = function () {
                NotifyService.notify(Events.RouteLocationChosen, this.location);
            }
        }

        NotifyService.subscribe($scope, Events.AssessmentCompleted, handleNoCurrentAssessment);
        NotifyService.subscribe($scope, Events.AssessmentDiscarded, handleNoCurrentAssessment);
        NotifyService.subscribe($scope, Events.RouteLocationsLoaded, handleNoCurrentAssessment);
        function handleNoCurrentAssessment() {
            vm.assessing = false;
            vm.assessmentViews = [];
            vm.currentLocationAssessment = null;
        }

        NotifyService.subscribe($scope, Events.NewAssessmentStarted, onCurrentAssessmentLoaded);
        NotifyService.subscribe($scope, Events.AssessmentUpdated, onCurrentAssessmentLoaded);
        function onCurrentAssessmentLoaded(event, currentAssessment) {
            vm.assessing = true;
            vm.assessmentViews = [];
            vm.currentLocationAssessment = null;
            vm.assessmentStartedAt = currentAssessment.started.format("YYYY-MM-DD HH:mm");
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

        NotifyService.subscribe($scope, Events.VesselLoaded, function (event, v) {
            vessel = v;
        });

        NotifyService.subscribe($scope, Events.AddRouteLocationDiscarded, onAddRouteLocationFinished);
        function onAddRouteLocationFinished() {
            if (unSubscribeRouteLocationCreated) {
                unSubscribeRouteLocationCreated();
                unSubscribeRouteLocationCreated = null;
            }
        }
    }

})();
