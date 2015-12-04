(function() {
    var module = angular.module('embryo.aton.service', []);
    
    module.service('AtonService', [ '$http',  '$log', function($http, $log) {
        var atonData = [
/*
            {point:{longitude: "-44.2873153686523", latitude: "60.1464042663574"}, description: "Aappilattoq."},
            {point:{longitude: "-51.7156524658203", latitude: "64.1723327636718"}, description: "Nuuk (Godthåb) Umiarsualivik (Skibshavn Indsejling)."},
            {point:{longitude: "-53.6867485046386", latitude: "66.5072174072265"}, description: "Qeqertarssuatsiaq."},
            {point:{longitude: "-53.4676933288574", latitude: "68.3056106567382"}, description: "Kangâtsiaq."},
            {point:{longitude: "-37.5680198669433", latitude: "65.5850296020507"}, description: "Ammassalik Ydre."},
            {point:{longitude: "-56.1402015686035", latitude: "72.7894439697265"}, description: "Upernavik Bagfyr."},
            {point:{longitude: "-52.1226806640625", latitude: "70.6758728027343"}, description: "Umanak Havn Forfyr."},
            {point:{longitude: "-51.085823059082", latitude: "69.2185745239257"}, description: "Ilulissat (Jakobs) Havn Indre Forfyr."},
            {point:{longitude: "-51.2059211730957", latitude: "68.813720703125"}, description: "Qasigiannguit (Christianshåb) Ankermærke Forfyr."},
            {point:{longitude: "-52.8859329223632", latitude: "68.7122726440429"}, description: "Ræveø Tværmærke Forfyr."},
            {point:{longitude: "-45.2307968139648", latitude: "60.1304321289062"}, description: "Nanortalik Bagfyr."}
*/
        ];

        var that = this;

        that.getAtonData = function(callBack) {
            if (atonData.length == 0) {
                $http({method: 'GET', url: 'partials/avpg/aton-data.json'}).
                then(function(response) {
                    atonData = response.data;
                    $log.debug("Successfully loaded "+ atonData.length +" AtoN");
                    callBack(atonData);
                }, function(response) {
                    $log.debug("Failed to retrieve AtoN data. HTTP Status: '" + response.status + "'");
                });
            } else {
                callBack(atonData);
            }
        }
    } ]);
})();