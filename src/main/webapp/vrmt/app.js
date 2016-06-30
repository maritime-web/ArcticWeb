
// Define all modules here
angular.module('vrmt.map', []);
angular.module('vrmt.app', []);

(function () {
    "use strict";

    angular.module('vrmt', ['ngAnimate', 'ngSanitize', 'ui.bootstrap', 'ui.bootstrap.accordion',
        'vrmt.map', 'vrmt.app', 'embryo.menu', 'embryo.authentication', 'embryo.routeService', 'embryo.vessel.service', 'embryo.scheduleService']);

    $(function() {
        embryo.authentication.currentPageRequiresAuthentication = true;
    });
})();

