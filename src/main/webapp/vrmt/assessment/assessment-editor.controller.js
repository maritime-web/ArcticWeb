(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .controller("AssessmentEditorController", AssessmentEditorController);

    AssessmentEditorController.$inject = ['$scope', 'RiskAssessmentService'];

    function AssessmentEditorController($scope, RiskAssessmentService) {
        var vm = this;

        vm.hide = true;
        vm.dismiss = dismiss;
        vm.save = save;
        vm.show = show;
        vm.clear = clear;
        vm.chosenLocation = chosenLocation;
        vm.sum = sum;
        vm.factorAssessments = [];

        function dismiss() {
            vm.hide = true;
            vm.clear();
        }

        function save() {
            var locationId = $scope.assessmentLocationState['chosen'].location.id;

            var fas = vm.factorAssessments.map(function (fa) {
                return fa.toScore();
            });
            RiskAssessmentService.createRiskAssessment($scope.route.id, locationId, fas)
                .then(
                    function (result) {
                        $scope.riskAssessmentEvents['created'] = result;
                    },
                    function (reason) {
                        //TODO display error reason
                        console.log(reason);
                    });
            vm.hide = true;
            vm.clear();
        }

        function show() {
            RiskAssessmentService.getRiskFactors($scope.mmsi).then(function (riskFactors) {
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
            var ca = $scope.assessmentLocationState['chosen'];
            return ca ? ca.location.id + '. ' + ca.location.name : null;
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

        $scope.$watch("editorActivator['showAssessmentEditor']", function (newValue, oldValue) {
            if (newValue && newValue !== oldValue) {
                console.log("Opening assessment editor for the '" + newValue + "' time");
                vm.show();
            }
        });
    }
})();