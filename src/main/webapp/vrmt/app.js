
// Define all modules here
angular.module('vrmt.map', []);
angular.module('vrmt.app', []);

(function () {
    "use strict";

    angular.module('vrmt', ['ngAnimate', 'ngSanitize', 'ui.bootstrap', 'ui.bootstrap.accordion',
        'vrmt.map', 'vrmt.app', 'embryo.menu', 'embryo.authentication']);

    $(function() {
        embryo.authentication.currentPageRequiresAuthentication = false;
    });
})();

