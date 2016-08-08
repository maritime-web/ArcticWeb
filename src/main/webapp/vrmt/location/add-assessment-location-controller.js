(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .controller("ModalInstanceCtrl", ModalInstanceCtrl);

    ModalInstanceCtrl.$inject = ['$scope', '$modalInstance', 'event'];
    function ModalInstanceCtrl($scope, $modalInstance, event) {
        $scope.loc = event;
    }

})();