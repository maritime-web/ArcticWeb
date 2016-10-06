// Define all modules here
angular.module('vrmt.map', []);
angular.module('vrmt.render', []);
angular.module('vrmt.app', []);

(function () {
    "use strict";

    angular.module('vrmt',
        [
            'ngAnimate', 'ngSanitize', 'ui.bootstrap', 'ui.bootstrap.accordion',
            'vrmt.render', 'vrmt.map', 'vrmt.app', 'embryo.menu', 'embryo.authentication', 'embryo.routeService',
            'embryo.vessel.service', 'embryo.scheduleService', 'angular-growl', 'embryo.pouchdb.services'
        ])
        .config(['growlProvider', function (growlProvider) {
        growlProvider.globalTimeToLive(6000);
        growlProvider.globalPosition('bottom-left');
    }]);

    $(function () {
        embryo.authentication.currentPageRequiresAuthentication = true;
    });
})();

