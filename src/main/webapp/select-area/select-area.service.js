(function () {

    var module = angular.module('embryo.areaselect');

    var selectionGroupPath = 'rest/areasOfInterest/';

    module.service('SelectAreaService', SelectAreaService);
    SelectAreaService.$inject = ['$http'];

    function SelectAreaService($http) {

        // Structure definition
        function SelectionGroup(name) {
            this.name = name;
            this.active = false;
            this.squares = [];
            this.getStatusLabel = function () {
                return this.active ? "Active" : "Click to activate";
            };
        }

        var selectionGroups = [];

        // Service implementation
        return {
            getSelectionGroups: function (success, error) {
                var messageId = embryo.messagePanel.show({text: "Retrieving selection areas..."});

                $http.get(embryo.baseUrl + selectionGroupPath + 'list', {

                    timeout: embryo.defaultTimeout
                }).then(function (response) {
                    var selectionGroupsFromService = response.data;
                    embryo.messagePanel.replace(messageId, {text: "Selection areas retrieved.", type: "success"});

                    selectionGroups = [];
                    for (var key in selectionGroupsFromService) {
                        var selectionGroupFromService = selectionGroupsFromService[key];

                        var selectionGroup = new SelectionGroup(selectionGroupFromService.name);

                        if (selectionGroupFromService.polygonsAsJson) {
                            selectionGroup.squares = JSON.parse(selectionGroupFromService.polygonsAsJson);
                        }

                        selectionGroup.active = selectionGroupFromService.active;

                        selectionGroups.push(selectionGroup);
                    }

                    success(selectionGroups);
                }).catch(function (response) {
                    var data = response.data;
                    var status = response.status;
                    var errorMsg = embryo.ErrorService.errorStatus(data, status, "requesting selection areas.");
                    embryo.messagePanel.replace(messageId, {text: errorMsg, type: "error"});

                    error(errorMsg, status);
                });
            },

            updateSelectionGroups: function (selectionGroups, success, error) {
                var messageId = embryo.messagePanel.show({
                    text: "Updating selection groups ..."
                });
                $http.post(embryo.baseUrl + selectionGroupPath + 'update', selectionGroups)
                    .then(function () {
                        embryo.messagePanel.replace(messageId, {text: "Selection areas updated.", type: 'success'});
                        success()
                    })
                    .catch(function (response) {
                            var errorMsg = embryo.ErrorService.errorStatus(response.data, response.status, "updating selectio areas");
                            embryo.messagePanel.replace(messageId, {text: errorMsg, type: 'error'});
                            error(errorMsg);
                        }
                    );
            },

            addSelectionGroup: function () {
                var newSelectionGroup = new SelectionGroup("New Area");
                selectionGroups.push(newSelectionGroup);
                return newSelectionGroup;
            }
        };

    }
})();

