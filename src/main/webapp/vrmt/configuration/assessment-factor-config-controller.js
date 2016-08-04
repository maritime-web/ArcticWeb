angular.module('vrmt.app')

    .controller("AssessmentFactorConfigController", ['$scope', 'RiskAssessmentService',
        function ($scope, RiskAssessmentService) {

            $scope.$watch('vessel', function (newVessel) {
                if (newVessel && newVessel.aisVessel) {
                    $scope.factorConfig.vesselName = newVessel.aisVessel.name || $scope.mmsi;
                }
            });

            $scope.$watch("editorActivator['showAssessmentFactorEditor']", function (newValue, oldValue) {
                if (newValue && newValue !== oldValue) {
                    console.log("Opening assessment factor editor for the '" + newValue + "' time");
                    $scope.factorConfig.show();
                }
            });

            $scope.factorConfig = {
                hide: true,
                vesselName: $scope.mmsi,
                show: function () {
                    this.hide = false;
                },
                dismiss: function () {
                    this.hide = true;
                },
                getVessel: function () {
                    return this.vesselName;
                },
                save: function (riskFactorView) {
                    RiskAssessmentService.saveRiskFactor(riskFactorView.toRiskFactor())
                        .then(function (riskFactor) {
                            console.log("Saved risk factor with id " + riskFactor.id);
                        }, function (reason) {
                            console.log(reason);
                        });
                },
                riskFactors: []
            };

            function RiskFactorView(riskFactor) {
                this.riskFactor = riskFactor;
                this.isActive = false;
                this.name = riskFactor.name;
                this.scoreOptions = riskFactor.scoreOptions;
                this.scoreInterval = riskFactor.scoreInterval
            }

            RiskFactorView.prototype.hasScoreOptions = function () {
                return (this.scoreOptions && this.scoreOptions.length > 0) || !this.scoreInterval;
            };
            RiskFactorView.prototype.deleteScoreOption = function (scoreOption) {
                var index = this.scoreOptions.indexOf(scoreOption);
                this.scoreOptions.splice(index, 1);
            };
            RiskFactorView.prototype.addScoreOption = function () {
                this.scoreOptions.push(new ScoreOption({name: '', index: 0}));
            };
            RiskFactorView.prototype.toRiskFactor = function () {
                return this.riskFactor;
            };

            RiskAssessmentService.getRiskFactors($scope.mmsi).then(function (riskFactors) {
                $scope.factorConfig.riskFactors = riskFactors.map(function (riskFactor) {
                    return new RiskFactorView(riskFactor);
                });
            });

        }]);