(function () {
    angular
        .module('vrmt.app')
        .controller("AssessmentFactorConfigController", AssessmentFactorConfigController);

    AssessmentFactorConfigController.$inject = ['$scope', 'RiskFactorService', 'NotifyService', 'Events', "growl"];

    function AssessmentFactorConfigController($scope, RiskFactorService, NotifyService, Events, growl) {
        var vm = this;
        vm.hide = true;
        vm.vesselName = $scope.mmsi;
        vm.show = show;
        vm.dismiss = dismiss;
        vm.getVessel = getVessel;
        vm.save = save;
        vm.riskFactors = [];

        NotifyService.subscribe($scope, Events.VesselLoaded, onVesselLoaded);
        function onVesselLoaded(event, newVessel) {
            if (newVessel.aisVessel) {
                vm.vesselName = newVessel.aisVessel.name || $scope.mmsi;
            }
        }

        NotifyService.subscribe($scope, Events.OpenAssessmentFactorEditor, vm.show);

        function show() {
            vm.hide = false;
        }

        function dismiss() {
            vm.hide = true;
        }

        function getVessel() {
            return vm.vesselName;
        }

        function save(riskFactorView) {
            RiskFactorService.saveRiskFactor(riskFactorView.toRiskFactor())
                .then(function (riskFactor) {
                    console.log("Saved risk factor with id " + riskFactor.id);
                    growl.success("Saved risk factor");
                }, function (reason) {
                    growl.error("Failed to save risk factor: " + reason);
                    console.log(reason);
                });
        }

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

        RiskFactorService.getRiskFactors($scope.mmsi).then(function (riskFactors) {
            vm.riskFactors = riskFactors.map(function (riskFactor) {
                return new RiskFactorView(riskFactor);
            });
        });
    }
})();