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


angular.module('vrmt.app')

    .controller("AssessmentEditorController", ['$scope', 'RiskAssessmentService', function ($scope, RiskAssessmentService) {

        $scope.$watch("editorActivator['showAssessmentEditor']", function (newValue, oldValue) {
            if (newValue && newValue !== oldValue) {
                console.log("Opening assessment editor for the '" + newValue + "' time");
                $scope.assessCreate.show();
            }
        });

        $scope.assessCreate = {
            hide: true,
            dismiss: function () {
                this.hide = true;
                this.clear();
            },
            save: function () {
                var locationId = $scope.assessmentLocationState['chosen'].location.id;

                var fas = this.factorAssessments.map(function (fa) {
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
                this.hide = true;
                this.clear();
            },
            show: function () {
                RiskAssessmentService.getRiskFactors($scope.mmsi).then(function (riskFactors) {
                    $scope.assessCreate.factorAssessments = riskFactors.map(function (riskFactor) {
                        return new FactorAssessmentViewModel(riskFactor);
                    });
                    $scope.assessCreate.hide = false;
                });
            },
            clear: function () {
                this.factorAssessments.forEach(function (f) {
                    f.model = {text: '-', index: 0};
                })
            },
            chosenLocation: function () {
                var ca = $scope.assessmentLocationState['chosen'];
                return ca ? ca.location.id + '. ' + ca.location.name : null;
            },
            sum: function () {
                var res = 0;
                this.factorAssessments.forEach(function (fa) {
                    res += angular.isNumber(fa.model.index) ? fa.model.index : 0;
                });

                return res;
            },
            factorAssessments: []
        };

    }]);
