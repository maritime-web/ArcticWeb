(function() {
    "use strict";
    var indexApp = angular.module('embryo.front', [ 'embryo.menu', 'embryo.user', 'ui.bootstrap.carousel' ]);
    $(function() {
        embryo.authentication.currentPageRequiresAuthentication = false;
    });
})();

