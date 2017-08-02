(function () {
    'use strict';

    angular
        .module('embryo.components.version')
        .service('VersionService', VersionService);

    VersionService.$inject = ['$http'];

    function VersionService($http) {
        this.serverVersion = function () {
            return $http.get(embryo.baseUrl + 'rest/version/build-version');
        };
    }
})();
