(function () {
    "use strict";
    angular.module('embryo.main.app').config([
        'growlProvider', '$locationProvider', function (growlProvider, $locationProvider) {
            growlProvider.globalTimeToLive(10000);
            growlProvider.globalPosition('bottom-left');

            $locationProvider.hashPrefix("");
        }
    ]);

})();
