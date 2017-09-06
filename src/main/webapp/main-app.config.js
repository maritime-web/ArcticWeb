(function () {
    "use strict";
    angular.module('embryo.main.app').config([
        'growlProvider', function (growlProvider) {
                             growlProvider.globalTimeToLive(10000);
                             growlProvider.globalPosition('bottom-left');
                         }
    ]);

})();
