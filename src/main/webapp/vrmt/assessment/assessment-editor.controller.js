(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .controller("AssessmentEditorController", AssessmentEditorController);

    AssessmentEditorController.$inject = ['$scope', 'RiskAssessmentService', 'RiskFactorService', 'RiskFactorAssessorService', 'NotifyService', 'VrmtEvents', 'growl'];

    function AssessmentEditorController($scope, RiskAssessmentService, RiskFactorService, RiskFactorAssessorService, NotifyService, VrmtEvents, growl) {
        var vm = this;

        vm.hide = true;
        vm.dismiss = dismiss;
        vm.save = save;
        vm.show = show;
        vm.clear = clear;
        vm.chosenLocation = chosenLocation;
        vm.sum = sum;
        vm.factorAssessments = [];
        vm.note = "";

        var chosenRoutelocation = null;
        var currentAssessment = null;

        function dismiss() {
            vm.hide = true;
            vm.clear();
        }

        function save() {
            var locationId = chosenRoutelocation.id;

            var scores = vm.factorAssessments.map(function (fa) {
                return fa.toScore();
            });
            RiskAssessmentService.createLocationAssessment(locationId, scores, vm.note)
                .then(
                    function (result) {
                        growl.success("Saved location assessment");
                        NotifyService.notify(VrmtEvents.LocationAssessmentCreated, result);
                    },
                    function (reason) {
                        growl.error("Could not save location assessment: " + reason);
                        console.log(reason);
                    });
            vm.hide = true;
            vm.clear();
        }

        function show() {
            if (!currentAssessment) return;

            var locationAssessment = currentAssessment.getLocationAssessment(chosenRoutelocation.id);

            var scoreMap = new Map();
            locationAssessment.scores.forEach(function (score) {
                scoreMap.set(score.riskFactorId, score);
            });

            RiskFactorService.getRiskFactors($scope.mmsi).then(function (riskFactors) {
                vm.factorAssessments = riskFactors.map(toViewModel);

                vm.factorAssessments.forEach(function (rfvm) {
                    var score = scoreMap.get(rfvm.riskFactor.id);
                    if (score && score.index > 0) {
                        if (rfvm.hasChoices) {
                            var previousScore = rfvm.scoreOptions.find(function (so) {
                                return so.name === score.name;
                            });
                            rfvm.model = previousScore ? previousScore : rfvm.model;
                            rfvm.model.source = score.source;
                        } else {
                            rfvm.model.index = score.index;
                        }
                    }
                });
                vm.factorAssessments.forEach(chooseOption);
                vm.note = locationAssessment.note;
                vm.hide = false;
            });
        }

        function toViewModel(riskFactor) {
            return new FactorAssessmentViewModel(riskFactor);
        }

        function chooseOption(viewModel) {
            RiskFactorAssessorService.chooseOption(chosenRoutelocation, viewModel.riskFactor)
                .then(function (chosenOption) {
                    if (chosenOption.index > 0 || chosenOption.name !== "-") {
                        viewModel.model = chosenOption;
                    }
                });
        }

        function clear() {
            vm.factorAssessments.forEach(function (f) {
                f.model = {name: '-', index: 0};
            })
        }

        function chosenLocation() {
            return chosenRoutelocation ? chosenRoutelocation.name : null;
        }

        function sum() {
            var res = 0;
            vm.factorAssessments.forEach(function (fa) {
                res += angular.isNumber(fa.model.index) ? fa.model.index : 0;
            });

            return res;
        }

        function FactorAssessmentViewModel(param) {
            this.riskFactor = param;
            this.name = param.name;
            this.scoreOptions = param.scoreOptions && param.scoreOptions.length > 0 ? [{name: "-", index: 0, source: null}].concat(param.scoreOptions) : null;
            this.model = {name: "-", index: 0, source: null};
            this.hasChoices = param.scoreOptions && param.scoreOptions.length > 0;
            this.minIndex = param.minIndex;
            this.maxIndex = param.maxIndex;
        }

        FactorAssessmentViewModel.prototype.toScore = function () {
            var chosenOptionName = this.model.name;
            var scoreOption;
            if (this.scoreOptions) {
                scoreOption = this.scoreOptions.find(function (option) {
                    return option.name === chosenOptionName;
                });
            }

            return new Score({
                riskFactor: this.riskFactor,
                scoreOption: scoreOption,
                index: this.model.index
            });
        };

        NotifyService.subscribe($scope, VrmtEvents.OpenAssessmentEditor, vm.show);

        NotifyService.subscribe($scope, VrmtEvents.AssessmentCompleted, handleNoCurrentAssessment);
        NotifyService.subscribe($scope, VrmtEvents.AssessmentDiscarded, handleNoCurrentAssessment);

        function handleNoCurrentAssessment() {
            currentAssessment = null;
        }

        NotifyService.subscribe($scope, VrmtEvents.AssessmentUpdated, function (event, assessment) {
            currentAssessment = assessment;
        });

        NotifyService.subscribe($scope, VrmtEvents.RouteLocationChosen, onRouteLocationChosen);

        function onRouteLocationChosen(event, chosen) {
            chosenRoutelocation = chosen;
        }
    }
})();