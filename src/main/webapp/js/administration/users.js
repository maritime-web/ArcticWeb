(function() {
    "use strict";

    angular.module('embryo.administration.users', [ 'embryo.userService', 'ui.bootstrap.modal',
            'ui.bootstrap.tpls', 'embryo.authentication' ])
        .controller('UserEmailController', UserEmailController)
        .controller('UsersCtrl', UsersCtrl);

    UsersCtrl.$inject = ['$scope', 'UserService', '$uibModal'];
    function UsersCtrl($scope, UserService, $uibModal) {
        var vm = this;

        var editUser;
        var userList = [];
        vm.users = userList;
        vm.message = null;
        vm.alertMessages = null;

        function loadUsers() {
            UserService.userList(function(users) {
                userList = users;
                vm.users = users;
            }, function(error) {
                vm.alertMessages = error;
            });
        }

        function loadSourceFilters() {
            UserService.sourceFilters(function (filters) {
                var sourceFilters = [];
                for (var index in filters) {
                    sourceFilters.push({
                        name: filters[index],
                        value: filters[index]
                    });
                }
                vm.sourceFilters = filters;
            }, function (error) {
                vm.alertMessages = error;
            });
        }

        function loadRolesCount() {
            UserService.rolesCount(function(rolesCount) {
                vm.rolesCount = rolesCount;
            }, function(error) {
                vm.alertMessages = error;
            });
        }

        loadSourceFilters();
        loadUsers();
        loadRolesCount();


        vm.roleText = function(logicalName) {
            if (logicalName == "Reporting") {
                return "Reporting Authority";
            }
            return logicalName;
        };

        function match(propertyValue, searchStr) {
            if (!propertyValue) {
                return false;
            }
            var value = ("" + propertyValue).toLowerCase();
            return ((value.indexOf(searchStr) == 0) || (value.indexOf(" " + searchStr) >= 0));
        }

        vm.search = function() {
            if (vm.searchString == null || vm.searchString == "") {
                vm.users = userList;
                return;
            }

            var users = [];
            var searchStr = vm.searchString.toLowerCase();

            for ( var index in userList) {
                var user = userList[index];
                if (match(user.login, searchStr) || match(user.shipMmsi, searchStr) || match(user.email, searchStr)) {
                    users.push(user);
                }
            }
            vm.users = users;
        };

        vm.edit = function($event, user) {
            $event.preventDefault();
            
            editUser = user;
            vm.message = null;
            vm.alertMessages = null;
            vm.editUser = {
            	login 			: user.login,
                email 			: user.email,
                role 			: user.role,
                shipMmsi 		: user.shipMmsi,
                aisFilterName: user.aisFilterName
            };
            vm.action = "Edit";
            $("#cLogin").focus();
        };

        vm.create = function() {
            vm.message = null;
            vm.alertMessages = null;
            vm.editUser = {};
            vm.action = "Create";
            $("#cLogin").focus();
        };

        vm.submitCreate = function() {
            vm.message = "Saving " + vm.editUser.login + " ...";
            vm.alertMessages = null;
            
            UserService.create(vm.editUser, function() {
                vm.message = "User " + vm.editUser.login + " created.";
                vm.action = "Edit";
                loadUsers();
                loadRolesCount();
            }, function(error) {
                vm.message = null;
                vm.alertMessages = error;
            });
        };

        function showModal(title, messages) {
            return $uibModal.open({
                controller : embryo.ConfirmModalCtrl,
                templateUrl : "confirmDialog.html",
                resolve : {
                    title : function() {
                        return title;
                    },
                    messages : function() {
                        return messages;
                    }
                }
            });
        }

        vm.showEmails = function () {
            var emails = "";
            angular.forEach(vm.users, function (user) {
                emails += user.email+',';
            });
            $uibModal.open({
                controller : 'UserEmailController',
                templateUrl : "emailAdresses.html",
                resolve : {
                    emails : function() {
                        return emails;
                    }
                }
            });
        };

        vm.submitEdit = function() {
            function save() {
                vm.message = "Saving " + vm.editUser.login + " ...";
                vm.alertMessages = null;
                UserService.edit(vm.editUser, function() {
                    vm.message = "User " + vm.editUser.login + " saved.";
                    vm.action = null;
                    loadUsers();
                    loadRolesCount();
                }, function(error) {
                    vm.message = null;
                    vm.alertMessages = error;
                });
            }
            var warnings = [];
            if (editUser.role != vm.editUser.role) {
                var msg = "You are about to change the role from " + editUser.role + " to " + vm.editUser.role
                        + ". ";
                if (editUser.role == 'Sailor') {
                    msg += "All information related to vessel with MMSI " + editUser.shipMmsi + " will be deleted.";
                }
                warnings.push(msg);
            }
            if (editUser.role == 'Sailor' && vm.editUser.role == 'Sailor'
                    && editUser.shipMmsi != vm.editUser.shipMmsi) {
                warnings.push("You are about to change the MMSI from " + editUser.shipMmsi + " to "
                        + vm.editUser.shipMmsi);
            }
            if (warnings.length > 0) {
                warnings.push("Please confirm changes");
                showModal("Save Modified User", warnings).result.then(save);
            } else {
                save();
            }
        };

        vm.del = function($event, user) {
            $event.preventDefault();

            var messages = [ "This will delete user " + user.login + (user.shipMmsi ? " / " + user.shipMmsi : "") ];
            showModal("Delete User", messages).result.then(function() {
                vm.message = "Deleting " + user.login + " ...";
                UserService.deleteUser(user.login, function() {
                    vm.message = "User " + user.login + " deleted.";
                    loadUsers();
                }, function(error) {
                    vm.message = null;
                    vm.alertMessages = error;
                });
            });
        };
    };

    embryo.ConfirmModalCtrl = function($scope, $uibModalInstance, title, messages) {
        $scope.title = title;
        $scope.messages = messages;
    };

    UserEmailController.$inject = ['$scope', '$uibModalInstance', 'emails'];
    function UserEmailController ($scope, $uibModalInstance, emails) {
        $scope.emails = emails;
    }

    function fixScrollables() {
        $(".scrollable").each(function(elem) {
            var rect = this.getBoundingClientRect();
            $(this).css("overflow", "auto");
            $(this).css("max-height", ($(window).height() - rect.top - 20) + "px");
        });
    }
    $(window).resize(fixScrollables);
    setTimeout(fixScrollables, 100);
})();
