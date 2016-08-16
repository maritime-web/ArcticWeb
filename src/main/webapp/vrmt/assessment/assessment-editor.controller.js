(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .controller("AssessmentEditorController", AssessmentEditorController);

    AssessmentEditorController.$inject = ['$scope', 'RiskAssessmentService', 'RiskFactorService', 'NotifyService', 'Events'];

    function AssessmentEditorController($scope, RiskAssessmentService, RiskFactorService, NotifyService, Events) {
        var vm = this;

        vm.hide = true;
        vm.dismiss = dismiss;
        vm.save = save;
        vm.show = show;
        vm.clear = clear;
        vm.chosenLocation = chosenLocation;
        vm.sum = sum;
        vm.factorAssessments = [];

        var chosenAssessment = null;

        function dismiss() {
            vm.hide = true;
            vm.clear();
        }

        function save() {
            var locationId = chosenAssessment.location.id;

            var fas = vm.factorAssessments.map(function (fa) {
                return fa.toScore();
            });
            RiskAssessmentService.createRiskAssessment($scope.route.id, locationId, fas)
                .then(
                    function (result) {
                        NotifyService.notify(Events.AssessmentCreated, result);
                    },
                    function (reason) {
                        //TODO display error reason
                        console.log(reason);
                    });
            vm.hide = true;
            vm.clear();
        }

        function show() {
            RiskFactorService.getRiskFactors($scope.mmsi).then(function (riskFactors) {
                vm.factorAssessments = riskFactors.map(function (riskFactor) {
                    return new FactorAssessmentViewModel(riskFactor);
                });
                vm.hide = false;
            });
        }

        function clear() {
            vm.factorAssessments.forEach(function (f) {
                f.model = {text: '-', index: 0};
            })
        }

        function chosenLocation() {
            return chosenAssessment ? chosenAssessment.location.id + '. ' + chosenAssessment.location.name : null;
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
            this.scoreOptions = param.scoreOptions;
            this.model = {name: "-", index: 0};
            this.hasChoices = param.scoreOptions && param.scoreOptions.length > 0;
            this.minIndex = param.minIndex;
            this.maxIndex = param.maxIndex;
        }
        FactorAssessmentViewModel.prototype.toScore = function () {
            var chosenOptionName = this.model.name;
            var scoringOption;
            if (this.scoreOptions) {
                scoringOption = this.scoreOptions.find(function (option) {
                    return option.name === chosenOptionName;
                });
            }

            return new Score({
                riskFactor: this.riskFactor,
                scoringOption: scoringOption,
                index: this.model.index
            });
        };

        NotifyService.subscribe($scope, Events.OpenAssessmentEditor, vm.show);

        NotifyService.subscribe($scope, Events.AssessmentLocationChosen, onAssessmentLocationChosen);
        function onAssessmentLocationChosen(event, chosen) {
            chosenAssessment = chosen;
        }
    }
})();