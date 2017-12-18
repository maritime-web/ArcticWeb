(function () {
    angular
        .module('vrmt.app')
        .controller("AssessmentFactorConfigController", AssessmentFactorConfigController);

    AssessmentFactorConfigController.$inject = ['$scope', 'RiskFactorService', 'NotifyService', 'VrmtEvents', "growl", '$timeout', '$q'];

    function AssessmentFactorConfigController($scope, RiskFactorService, NotifyService, VrmtEvents, growl, $timeout, $q) {
        var vm = this;
        vm.hide = true;
        vm.vesselName = undefined;
        vm.show = show;
        vm.dismiss = dismiss;
        vm.getVessel = getVessel;
        vm.save = save;
        vm.getBerths = getBerths;
        vm.riskFactors = [];
        var berths;

        initialize();

        function initialize() {
            if ($scope.mmsi) {
                vm.vesselName = $scope.mmsi;
                RiskFactorService.getRiskFactors($scope.mmsi).then(function (riskFactors) {
                    vm.riskFactors = riskFactors.map(function (riskFactor) {
                        return new RiskFactorView(riskFactor);
                    });

                    var berthUrl = embryo.baseUrl + 'rest/berth/search';

                    berths = new Bloodhound({
                        datumTokenizer: Bloodhound.tokenizers.obj.nonword('value'),
                        queryTokenizer: Bloodhound.tokenizers.whitespace,
                        prefetch: {
                            url: berthUrl,
                            // 1 week
                            ttl: 7 * 24 * 60 * 60 * 1000
                        },
                        remote: berthUrl + "?q=%QUERY"
                    });

                    berths.initialize();

                });
            } else {
                $timeout(function () {
                    initialize();
                }, 10)
            }
        }

        NotifyService.subscribe($scope, VrmtEvents.VesselLoaded, onVesselLoaded);
        function onVesselLoaded(event, newVessel) {
            if (newVessel.aisVessel) {
                vm.vesselName = newVessel.aisVessel.name || $scope.mmsi;
            }
        }

        NotifyService.subscribe($scope, VrmtEvents.OpenAssessmentFactorEditor, vm.show);

        function getBerths(query) {
            return function () {
                var deferred = $q.defer();
                berths.get(query, function (suggestions) {
                    deferred.resolve(suggestions);
                });
                return deferred.promise;
            }().then(function (res) {
                return res;
            });
        }

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
                    growl.success("Saved risk factor: " + riskFactor.name);
                }, function (reason) {
                    growl.error("Failed to save risk factor: " + reason);
                });
        }

        var riskFactorWithSupport = "3. Landing sites";

        function RiskFactorView(riskFactor) {
            this.riskFactor = riskFactor;
            this.isActive = false;
            this.name = riskFactor.name;
            this.scoreOptions = riskFactor.scoreOptions;
            this.scoreInterval = riskFactor.scoreInterval;
            this.optionSupport = riskFactor.name === riskFactorWithSupport;
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

    }
})();