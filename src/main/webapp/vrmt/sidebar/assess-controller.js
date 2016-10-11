(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .controller("AssessController", AssessController);

    AssessController.$inject = ['$scope', '$timeout', '$interval', 'RiskAssessmentService', 'NotifyService', 'Events', 'growl'];

    function AssessController($scope, $timeout, $interval, RiskAssessmentService, NotifyService, Events, growl) {
        var vm = this;
        vm.active = false;
        vm.currentLocationAssessment = null;
        vm.assessmentStartedAt = null;
        vm.assessmentViews = [];
        vm.startNew = startNew;
        vm.save = save;
        vm.discard = discard;
        vm.assessing = false;
        vm.isInAssessable = true;
        vm.isComplete = false;
        vm.newAssessmentNotPossibleWarning = undefined;
        vm.discardTime = null;
        var currentRoute = null;
        var currentAssessment = null;
        var vessel = null;
        var unSubscribeRouteLocationCreated = null;
        var cancelStartTimeInterval;
        var cancelDiscardTimer;
        var discardTimeout = 3600000;

        function startNew() {
            if (currentRoute.isVesselOnRoute()) {
                addCurrentPositionAsRouteLocationThenStartAssessment();
            } else {
                startAssessment();
            }
        }

        function addCurrentPositionAsRouteLocationThenStartAssessment() {
            unSubscribeRouteLocationCreated = NotifyService.subscribe($scope, Events.RouteLocationCreated, function () {
                startAssessment();
                onAddRouteLocationFinished();
            });

            var addRouteLocationEvent = {
                introduction: "Before the new assessment can start you need to create a new assessment location on your vessels current position. Please override the given ais position if it isn't correct. The ais position was last recieved " + moment().utc().to(vessel.aisVessel.lastReport),
                name: "Position at " + moment().utc().format("MM-DD HH:mm"),
                vessel: {
                    ais: vessel ? vessel.aisVessel : {},
                    override: vessel ? Object.assign({}, vessel.aisVessel) : {}
                }
            };

            NotifyService.notify(Events.AddRouteLocation, addRouteLocationEvent)
        }

        function startAssessment() {
            RiskAssessmentService.startNewAssessment()
                .then(function (currentAssessment) {
                    growl.info("Started new risk assesssment");
                    NotifyService.notify(Events.NewAssessmentStarted, currentAssessment);
                })
                .catch(function (e) {
                    growl.error("<p>Unable to start new risk assessment:</p>" + e.message);
                    console.log(e);
                });
        }

        function save() {
            RiskAssessmentService.endAssessment()
                .then(function () {
                    growl.success("Risk assessment saved");
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
            this.valid = assessment.scores.length > 0;

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
            if (cancelStartTimeInterval) {
                $interval.cancel(cancelStartTimeInterval);
            }
        }

        NotifyService.subscribe($scope, Events.NewAssessmentStarted, onNewAssessmentStarted);

        function onNewAssessmentStarted(event, assessment) {
            onCurrentAssessmentLoaded(event, assessment);
            cancelStartTimeInterval = $interval(updateStarttime, 1000);
            createDiscardTimer(discardTimeout);
        }

        function updateStarttime() {
            vm.assessmentStartedAt = currentAssessment.started.fromNow();
        }

        NotifyService.subscribe($scope, Events.AssessmentUpdated, onCurrentAssessmentLoaded);
        function onCurrentAssessmentLoaded(event, assessment) {
            currentAssessment = assessment;
            vm.assessing = true;
            vm.isComplete = assessment.isComplete();
            vm.assessmentViews = [];
            vm.currentLocationAssessment = null;
            vm.assessmentStartedAt = assessment.started.fromNow(); //format("YYYY-MM-DD HH:mm");
            var routeLocations = assessment.locationsToAssess;
            routeLocations.sort(byEta);
            routeLocations.forEach(function (routeLocation) {
                var locationAssessment = assessment.getLocationAssessment(routeLocation.id);
                var assessmentView = new LocationAssessmentView(locationAssessment);
                vm.assessmentViews.push(assessmentView);
            });
            createDiscardTimer(discardTimeout - moment().utc().diff(assessment.started));
        }

        function byEta(a, b) {
            if (moment(a.eta).isAfter(b.eta)) {
                return 1;
            } else if (moment(a.eta).isSame(b.eta)) {
                return 0;
            } else {
                return -1;
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
            currentRoute = new embryo.vrmt.Route(newRoute);
            vm.isInAssessable = currentRoute.isCompleted();
            vm.newAssessmentNotPossibleWarning = vm.isInAssessable ? "Please note. It is not possible to start a new assessment on an already completed route!" : undefined;
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

        // Clean up when the scope is destroyed
        $scope.$on('$destroy', function () {
            clearStartTimeInterval();
            clearDiscardTimer();
        });

        function clearStartTimeInterval() {
            if (cancelStartTimeInterval) {
                $interval.cancel(cancelStartTimeInterval);
                cancelStartTimeInterval = null;
            }
        }
        function createDiscardTimer(timeout) {
            vm.discardTime = moment().utc().format();
            clearDiscardTimer();
            if (timeout >= 0) {
                cancelDiscardTimer = $timeout(discard, timeout);
                vm.discardTime = moment().utc().add(timeout, 'ms').format("YYYY-MM-DD HH:mm UTC");
            } else {
                $timeout(discard);
            }
        }

        function clearDiscardTimer() {
            if (cancelDiscardTimer) {
                $timeout.cancel(cancelDiscardTimer);
                cancelDiscardTimer = null;
            }
        }
    }

})();
