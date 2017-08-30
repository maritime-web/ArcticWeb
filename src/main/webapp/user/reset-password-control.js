(function () {
    'use strict';

    angular.module('embryo.user')
        .controller('ResetPasswordController', ResetPasswordController)
        .controller('ResetPasswordModalController', ResetPasswordModalController);

    ResetPasswordController.$inject = ['$modal', 'Subject', 'growl'];

    function ResetPasswordController($modal, Subject, growl) {
        var vm = this;
        vm.changePasswordDialog = function (event, username) {
            event.preventDefault();

            var modalInstance = $modal.open({
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
                    .then(function (result) {
                        var user = "";
                        if (result && result.config && result.config.data) {
                            user = result.config.data.username;
                        }
                        growl.success("Password changed successfully for user: '" + user +"'");
                    })
                    .catch(function (err, status) {
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