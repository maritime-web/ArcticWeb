(function () {
    'use strict';

    angular.module('embryo.user')
        .controller('ResetPasswordController', ResetPasswordController)
        .controller('ResetPasswordModalController', ResetPasswordModalController);

    ResetPasswordController.$inject = ['$uibModal', 'Subject', 'growl'];

    function ResetPasswordController($uibModal, Subject, growl) {
        var vm = this;
        vm.changePasswordDialog = function (event, username) {
            event.preventDefault();

            var modalInstance = $uibModal.open({
                controller : 'ResetPasswordModalController',
                templateUrl : "reset-password.html",
                resolve : {
                    userName: function () {
                        return username;
                    }
                }
            });

            modalInstance.result.then(reset, dismiss);

            function reset(result) {
                Subject.changePassword(result.password, username)
                    .then(function (response) {
                        var user = "";
                        if (response && response.config && response.config.data) {
                            user = response.config.data.username;
                        }
                        growl.success("Password changed successfully for user: '" + user +"'");
                    })
                    .catch(function (response) {
                        var err = response.data;
                        var status = response.status;
                        var errorMsg = status ? embryo.ErrorService.extractError(err, status) : err;
                        growl.error("Failed to change password. " + errorMsg);
                    });
            }

            function dismiss() {
                growl.info("Password change dismissed");
            }
        }
    }

    ResetPasswordModalController.$inject = ['$scope', 'Subject', 'userName'];
    function ResetPasswordModalController ($scope, Subject, username) {
        $scope.res = {userName: username || Subject.getDetails().userName};
    }

})();