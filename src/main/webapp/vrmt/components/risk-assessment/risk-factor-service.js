(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .service('RiskFactorService', RiskFactorService);

    RiskFactorService.$inject = ['$q', 'RiskAssessmentDataService', 'growl'];

    function RiskFactorService($q, RiskAssessmentDataService, growl) {
        var defaultSource = "Manual";

        this.getRiskFactors = getRiskFactors;
        this.saveRiskFactor = saveRiskFactor;

        function getDefaultRiskFactorData(vesselId) {
            return [
                new RiskFactor({
                    vesselId: vesselId,
                    id: 1,
                    name: '1. Regions',
                    scoreOptions: [
                        new ScoreOption({source: defaultSource, name: 'Region AA', index: 40}),
                        new ScoreOption({source: defaultSource, name: 'Region BA', index: 160}),
                        new ScoreOption({source: defaultSource, name: 'Region CA', index: 200}),
                        new ScoreOption({source: defaultSource, name: 'Region DA', index: 30}),
                        new ScoreOption({source: defaultSource, name: 'Region EA', index: 500}),
                        new ScoreOption({source: defaultSource, name: 'Special area 1A', index: 300}),
                        new ScoreOption({source: defaultSource, name: 'Special area 2A', index: 140}),
                        new ScoreOption({source: defaultSource, name: 'Special area 3A', index: 300}),
                        new ScoreOption({source: defaultSource, name: 'Special area 4A', index: 200})
                    ]
                }),
                new RiskFactor({
                    vesselId: vesselId,
                    id: 2,
                    name: '2. Time of the season',
                    scoreOptions: [
                        new ScoreOption({source: defaultSource, name: 'May', index: 300}),
                        new ScoreOption({source: defaultSource, name: 'June', index: 200}),
                        new ScoreOption({source: defaultSource, name: 'July', index: 50}),
                        new ScoreOption({source: defaultSource, name: 'August', index: 25}),
                        new ScoreOption({source: defaultSource, name: 'September', index: 140})
                    ]
                }),
                new RiskFactor({
                    vesselId: vesselId,
                    id: 3,
                    name: '3. Landing sites',
                    scoreOptions: [
                        new ScoreOption({source: defaultSource, name: 'Nuuk', index: 200}),
                        new ScoreOption({source: defaultSource, name: 'Longyearbyen', index: 300}),
                        new ScoreOption({source: defaultSource, name: 'Sorgfjorden', index: 450}),
                        new ScoreOption({source: defaultSource, name: 'Paamiut', index: 200}),
                        new ScoreOption({source: defaultSource, name: 'Qaqortoq', index: 150}),
                        new ScoreOption({source: defaultSource, name: 'Nanortalik', index: 125}),
                        new ScoreOption({source: defaultSource, name: 'Kulusuk', index: 400}),
                        new ScoreOption({source: defaultSource, name: 'Tasiilaq', index: 450})
                    ]
                }),
                new RiskFactor({
                    vesselId: vesselId,
                    id: 4,
                    name: '4. Tide',
                    scoreOptions: [
                        new ScoreOption({source: defaultSource, name: 'HW Spring', index: 300}),
                        new ScoreOption({source: defaultSource, name: 'HW Nip', index: 100}),
                        new ScoreOption({source: defaultSource, name: 'LW Spring', index: 50}),
                        new ScoreOption({source: defaultSource, name: 'LW Nip', index: 80})
                    ]
                }),
                new RiskFactor({
                    vesselId: vesselId,
                    id: 5,
                    name: '5. Current Expected',
                    scoreOptions: [
                        new ScoreOption({source: defaultSource, name: 'No current, slack', index: 0}),
                        new ScoreOption({source: defaultSource, name: 'Weak current', index: 40}),
                        new ScoreOption({source: defaultSource, name: 'Medium current', index: 100}),
                        new ScoreOption({source: defaultSource, name: 'Strong current', index: 400})
                    ]
                }),
                new RiskFactor({
                    vesselId: vesselId,
                    id: 6,
                    name: '6. Distance to SAR facilities, other ships',
                    scoreOptions: [
                        new ScoreOption({source: defaultSource, name: '10 nm One vessel', index: 10}),
                        new ScoreOption({source: defaultSource, name: '20 nm One vessel', index: 20}),
                        new ScoreOption({source: defaultSource, name: '40 nm One vessel', index: 35}),
                        new ScoreOption({source: defaultSource, name: '60 nm One vessel', index: 55}),
                        new ScoreOption({source: defaultSource, name: '80 nm One vessel', index: 80}),
                        new ScoreOption({source: defaultSource, name: '100 nm One vessel', index: 110}),
                        new ScoreOption({source: defaultSource, name: '120 nm One vessel', index: 140}),
                        new ScoreOption({source: defaultSource, name: '140 nm One vessel', index: 190}),
                        new ScoreOption({source: defaultSource, name: '160 nm One vessel', index: 270}),
                        new ScoreOption({source: defaultSource, name: '180 nm One vessel', index: 500}),
                        new ScoreOption({source: defaultSource, name: '200 nm One vessel', index: 800}),
                        new ScoreOption({source: defaultSource, name: '10 nm Two vessels', index: 10}),
                        new ScoreOption({source: defaultSource, name: '20 nm Two vessels', index: 15}),
                        new ScoreOption({source: defaultSource, name: '40 nm Two vessels', index: 30}),
                        new ScoreOption({source: defaultSource, name: '60 nm Two vessels', index: 40}),
                        new ScoreOption({source: defaultSource, name: '80 nm Two vessels', index: 60}),
                        new ScoreOption({source: defaultSource, name: '100 nm Two vessels', index: 80}),
                        new ScoreOption({source: defaultSource, name: '120 nm Two vessels', index: 115}),
                        new ScoreOption({source: defaultSource, name: '140 nm Two vessels', index: 155}),
                        new ScoreOption({source: defaultSource, name: '160 nm Two vessels', index: 205}),
                        new ScoreOption({source: defaultSource, name: '180 nm Two vessels', index: 260}),
                        new ScoreOption({source: defaultSource, name: '200 nm Two vessels', index: 320}),
                        new ScoreOption({source: defaultSource, name: '220 nm Two vessels', index: 400}),
                        new ScoreOption({source: defaultSource, name: '240 nm Two vessels', index: 750}),
                        new ScoreOption({source: defaultSource, name: '10 nm Three or more vessels', index: 10}),
                        new ScoreOption({source: defaultSource, name: '20 nm Three or more vessels', index: 15}),
                        new ScoreOption({source: defaultSource, name: '40 nm Three or more vessels', index: 20}),
                        new ScoreOption({source: defaultSource, name: '60 nm Three or more vessels', index: 25}),
                        new ScoreOption({source: defaultSource, name: '80 nm Three or more vessels', index: 40}),
                        new ScoreOption({source: defaultSource, name: '100 nm Three or more vessels', index: 55}),
                        new ScoreOption({source: defaultSource, name: '120 nm Three or more vessels', index: 80}),
                        new ScoreOption({source: defaultSource, name: '140 nm Three or more vessels', index: 100}),
                        new ScoreOption({source: defaultSource, name: '160 nm Three or more vessels', index: 135}),
                        new ScoreOption({source: defaultSource, name: '180 nm Three or more vessels', index: 170}),
                        new ScoreOption({source: defaultSource, name: '200 nm Three or more vessels', index: 220}),
                        new ScoreOption({source: defaultSource, name: '220 nm Three or more vessels', index: 280}),
                        new ScoreOption({source: defaultSource, name: '240 nm Three or more vessels', index: 340}),
                        new ScoreOption({source: defaultSource, name: '260 nm Three or more vessels', index: 410}),
                        new ScoreOption({source: defaultSource, name: '300 nm Three or more vessels', index: 500})
                    ]
                }),
                new RiskFactor({
                    vesselId: vesselId,
                    id: 7,
                    name: '7. Ice cover and type of ice',
                    scoreOptions: [
                        new ScoreOption({source: defaultSource, name: '1/10 - One year sea ice', index: 0}),
                        new ScoreOption({source: defaultSource, name: '2/10 - One year sea ice', index: 10}),
                        new ScoreOption({source: defaultSource, name: '3/10 - One year sea ice', index: 30}),
                        new ScoreOption({source: defaultSource, name: '4/10 - One year sea ice', index: 50}),
                        new ScoreOption({source: defaultSource, name: '5/10 - One year sea ice', index: 150}),
                        new ScoreOption({source: defaultSource, name: '6/10 - One year sea ice', index: 250}),
                        new ScoreOption({source: defaultSource, name: '7/10 - One year sea ice', index: 500}),
                        new ScoreOption({source: defaultSource, name: '8/10 - One year sea ice', index: 1200}),
                        new ScoreOption({source: defaultSource, name: '9/10 - One year sea ice', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '10/10 - One year sea ice', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '+10/10 - One year sea ice', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '1/10 - Two-three year sea ice', index: 30}),
                        new ScoreOption({source: defaultSource, name: '2/10 - Two-three year sea ice', index: 50}),
                        new ScoreOption({source: defaultSource, name: '3/10 - Two-three year sea ice', index: 150}),
                        new ScoreOption({source: defaultSource, name: '4/10 - Two-three year sea ice', index: 250}),
                        new ScoreOption({source: defaultSource, name: '5/10 - Two-three year sea ice', index: 500}),
                        new ScoreOption({source: defaultSource, name: '6/10 - Two-three year sea ice', index: 1200}),
                        new ScoreOption({source: defaultSource, name: '7/10 - Two-three year sea ice', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '8/10 - Two-three year sea ice', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '9/10 - Two-three year sea ice', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '10/10 - Two-three year sea ice', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '+10/10 - Two-three year sea ice', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '1/10 - Multi year sea ice', index: 50}),
                        new ScoreOption({source: defaultSource, name: '2/10 - Multi year sea ice', index: 100}),
                        new ScoreOption({source: defaultSource, name: '3/10 - Multi year sea ice', index: 500}),
                        new ScoreOption({source: defaultSource, name: '4/10 - Multi year sea ice', index: 1000}),
                        new ScoreOption({source: defaultSource, name: '5/10 - Multi year sea ice', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '6/10 - Multi year sea ice', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '7/10 - Multi year sea ice', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '8/10 - Multi year sea ice', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '9/10 - Multi year sea ice', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '10/10 - Multi year sea ice', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '+10/10 - Multi year sea ice', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '1/10 - Growler', index: 30}),
                        new ScoreOption({source: defaultSource, name: '2/10 - Growler', index: 50}),
                        new ScoreOption({source: defaultSource, name: '3/10 - Growler', index: 250}),
                        new ScoreOption({source: defaultSource, name: '4/10 - Growler', index: 500}),
                        new ScoreOption({source: defaultSource, name: '5/10 - Growler', index: 1000}),
                        new ScoreOption({source: defaultSource, name: '6/10 - Growler', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '7/10 - Growler', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '8/10 - Growler', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '9/10 - Growler', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '10/10 - Growler', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '+10/10 - Growler', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '1/10 - Bergy Bits', index: 50}),
                        new ScoreOption({source: defaultSource, name: '2/10 - Bergy Bits', index: 100}),
                        new ScoreOption({source: defaultSource, name: '3/10 - Bergy Bits', index: 500}),
                        new ScoreOption({source: defaultSource, name: '4/10 - Bergy Bits', index: 1000}),
                        new ScoreOption({source: defaultSource, name: '5/10 - Bergy Bits', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '6/10 - Bergy Bits', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '7/10 - Bergy Bits', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '8/10 - Bergy Bits', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '9/10 - Bergy Bits', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '10/10 - Bergy Bits', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '+10/10 - Bergy Bits', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '1/10 - Ice berg', index: 50}),
                        new ScoreOption({source: defaultSource, name: '2/10 - Ice berg', index: 100}),
                        new ScoreOption({source: defaultSource, name: '3/10 - Ice berg', index: 1000}),
                        new ScoreOption({source: defaultSource, name: '4/10 - Ice berg', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '5/10 - Ice berg', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '6/10 - Ice berg', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '7/10 - Ice berg', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '8/10 - Ice berg', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '9/10 - Ice berg', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '10/10 - Ice berg', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '+10/10 - Ice berg', index: 2000})
                    ]
                }),
                new RiskFactor({
                    vesselId: vesselId,
                    id: 8,
                    name: '8. Wind speed',
                    scoreOptions: [
                        new ScoreOption({source: defaultSource, name: '0', index: 0}),
                        new ScoreOption({source: defaultSource, name: '1', index: 5}),
                        new ScoreOption({source: defaultSource, name: '2', index: 10}),
                        new ScoreOption({source: defaultSource, name: '3', index: 25}),
                        new ScoreOption({source: defaultSource, name: '4', index: 45}),
                        new ScoreOption({source: defaultSource, name: '5', index: 75}),
                        new ScoreOption({source: defaultSource, name: '6', index: 110}),
                        new ScoreOption({source: defaultSource, name: '7', index: 150}),
                        new ScoreOption({source: defaultSource, name: '8', index: 200}),
                        new ScoreOption({source: defaultSource, name: '9', index: 400}),
                        new ScoreOption({source: defaultSource, name: '10', index: 900}),
                        new ScoreOption({source: defaultSource, name: '11', index: 2000}),
                        new ScoreOption({source: defaultSource, name: '12', index: 2000})
                    ]
                }),
                new RiskFactor({
                    vesselId: vesselId,
                    id: 9,
                    name: '9. Air temperature',
                    scoreOptions: [
                        new ScoreOption({source: defaultSource, name: '10', index: 0}),
                        new ScoreOption({source: defaultSource, name: '5', index: 0}),
                        new ScoreOption({source: defaultSource, name: '0', index: 0}),
                        new ScoreOption({source: defaultSource, name: '-5', index: 50}),
                        new ScoreOption({source: defaultSource, name: '-10', index: 100}),
                        new ScoreOption({source: defaultSource, name: '-15', index: 175}),
                        new ScoreOption({source: defaultSource, name: '-20', index: 250}),
                        new ScoreOption({source: defaultSource, name: '-25', index: 500}),
                        new ScoreOption({source: defaultSource, name: '-30', index: 1000})
                    ]
                }),
                new RiskFactor({
                    vesselId: vesselId,
                    id: 10,
                    name: '10. Sea conditions',
                    scoreOptions: [
                        new ScoreOption({source: defaultSource, name: '0m', index: 0}),
                        new ScoreOption({source: defaultSource, name: '1m', index: 50}),
                        new ScoreOption({source: defaultSource, name: '2m', index: 125}),
                        new ScoreOption({source: defaultSource, name: '3m', index: 225}),
                        new ScoreOption({source: defaultSource, name: '4m', index: 325}),
                        new ScoreOption({source: defaultSource, name: '5m', index: 425}),
                        new ScoreOption({source: defaultSource, name: '6m', index: 540}),
                        new ScoreOption({source: defaultSource, name: '7m', index: 675}),
                        new ScoreOption({source: defaultSource, name: '8m', index: 825}),
                        new ScoreOption({source: defaultSource, name: '9m', index: 1000}),
                        new ScoreOption({source: defaultSource, name: '10m', index: 1200}),
                        new ScoreOption({source: defaultSource, name: '11m', index: 1350}),
                        new ScoreOption({source: defaultSource, name: '12m', index: 1500}),
                        new ScoreOption({source: defaultSource, name: '13m', index: 1600}),
                        new ScoreOption({source: defaultSource, name: '14m', index: 1675}),
                        new ScoreOption({source: defaultSource, name: '15m', index: 1750}),
                        new ScoreOption({source: defaultSource, name: '16m', index: 1800}),
                        new ScoreOption({source: defaultSource, name: '17m', index: 1850}),
                        new ScoreOption({source: defaultSource, name: '18m', index: 1900}),
                        new ScoreOption({source: defaultSource, name: '19m', index: 1950})
                    ]
                }),
                new RiskFactor({
                    vesselId: vesselId,
                    id: 11,
                    name: '11. Visibility',
                    scoreOptions: [
                        new ScoreOption({source: defaultSource, name: '10nm', index: 0}),
                        new ScoreOption({source: defaultSource, name: '9nm', index: 0}),
                        new ScoreOption({source: defaultSource, name: '8nm', index: 0}),
                        new ScoreOption({source: defaultSource, name: '7nm', index: 0}),
                        new ScoreOption({source: defaultSource, name: '6nm', index: 5}),
                        new ScoreOption({source: defaultSource, name: '5nm', index: 10}),
                        new ScoreOption({source: defaultSource, name: '4nm', index: 15}),
                        new ScoreOption({source: defaultSource, name: '3nm', index: 25}),
                        new ScoreOption({source: defaultSource, name: '2nm', index: 35}),
                        new ScoreOption({source: defaultSource, name: '1nm', index: 45}),
                        new ScoreOption({source: defaultSource, name: '0.9nm', index: 55}),
                        new ScoreOption({source: defaultSource, name: '0.8nm', index: 70}),
                        new ScoreOption({source: defaultSource, name: '0.7nm', index: 85}),
                        new ScoreOption({source: defaultSource, name: '0.6nm', index: 100}),
                        new ScoreOption({source: defaultSource, name: '0.5nm', index: 120}),
                        new ScoreOption({source: defaultSource, name: '0.4nm', index: 140}),
                        new ScoreOption({source: defaultSource, name: '0.3nm', index: 175}),
                        new ScoreOption({source: defaultSource, name: '0.2nm', index: 225}),
                        new ScoreOption({source: defaultSource, name: '0.1nm', index: 500}),
                        new ScoreOption({source: defaultSource, name: '0nm', index: 1000})
                    ]
                }),
                new RiskFactor({
                    vesselId: vesselId,
                    id: 12,
                    name: '12. Quality of maps',
                    scoreOptions: [
                        new ScoreOption({source: defaultSource, name: 'ENC full detail', index: 0}),
                        new ScoreOption({source: defaultSource, name: 'Old meassurements', index: 100}),
                        new ScoreOption({source: defaultSource, name: 'No map', index: 500})
                    ]
                }),
                new RiskFactor({
                    vesselId: vesselId,
                    id: 13,
                    name: '13. Daylight',
                    scoreOptions: [
                        new ScoreOption({source: defaultSource, name: 'Morning nautical twilight', index: 50}),
                        new ScoreOption({source: defaultSource, name: 'Evening nautical twilight', index: 50}),
                        new ScoreOption({source: defaultSource, name: 'Night', index: 100}),
                        new ScoreOption({source: defaultSource, name: 'Day', index: 0})
                    ]
                }),
                new RiskFactor({
                    vesselId: vesselId,
                    id: 14,
                    name: '14. Miscellaneous',
                    scoreInterval: new ScoreInterval({minIndex: 0, maxIndex: 500})
                })
            ];
        }

        function getRiskFactors(vesselId) {
            return RiskAssessmentDataService.getRiskFactorData()
                .then(function (riskFactors) {
                    if (riskFactors) {
                        riskFactors = riskFactors.map(function (factor) {
                            if (factor.scoreOptions) {
                                factor.scoreOptions = factor.scoreOptions.map(function (scoreOption) {
                                    scoreOption.source = defaultSource;
                                    return scoreOption;
                                });
                            }
                            return factor;
                        });
                    }
                    return riskFactors || getDefaultRiskFactorData(vesselId);
                }).catch(function (err) {
                    console.log(err);
                    growl.error(err);
                    return $q.reject(err);
                });
        }

        function saveRiskFactor(riskFactor) {
            var vesselId = riskFactor.vesselId;
            return getRiskFactors(vesselId)
                .then(function (riskFactors) {
                    var id = riskFactor.id;
                    var indexOfRiskFactor = riskFactors.findIndex(function (r) {
                        return r.id === id
                    });
                    riskFactors.splice(indexOfRiskFactor, 1, riskFactor);

                    return RiskAssessmentDataService.storeRiskFactorData(riskFactors)
                        .then(function () {
                            return riskFactor;
                        });
                });
        }
    }
})();