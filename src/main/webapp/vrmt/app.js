(function () {
    "use strict";

    angular.module('vrmt',
        [
            'vrmt.render',
            'vrmt.map',
            'vrmt.model',
            'vrmt.app',

            'embryo.menu',
            'embryo.user',
            'embryo.authentication',

            'angular-growl'
        ])
        .config(['growlProvider', function (growlProvider) {
        growlProvider.globalTimeToLive(6000);
        growlProvider.globalPosition('bottom-left');
    }]);

    $(function () {
        embryo.authentication.currentPageRequiresAuthentication = true;
    });
})();

