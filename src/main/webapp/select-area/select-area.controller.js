(function () {

    var module = angular.module('embryo.areaselect');

    var selectionLayer;

    module.controller("SelectAreaController", SelectAreaController);

    SelectAreaController.$inject = ['$scope', 'SelectAreaService', 'SubscriptionService', 'SelectAreaEvents', 'NotifyService'];

    function SelectAreaController($scope, SelectAreaService, SubscriptionService, SelectAreaEvents, NotifyService) {
        this.scope = $scope;
        $scope.selectionGroups = [];
        $scope.alertMessages = [];
        $scope.deregistrationFunction = null;
        NotifyService.notify(SelectAreaEvents.SelectAreaActive);

        var getSelectionGroupsFromService = function () {
            SelectAreaService.getSelectionGroups(
                // Callback success <- called by SelectAreaService
                function (selectionGroupsFromService) {
                    $scope.errorMsg = null;
                    $scope.selectionGroups = [];
                    $scope.selectionGroups = selectionGroupsFromService;

                    for (var key in $scope.selectionGroups) {
                        var selectionGroup = $scope.selectionGroups[key];
                        selectionGroup.editMode = false;
                    }
                },
                // Callback error <- called by SelectAreaService
                function (error, status) {
                    $scope.errorMsg = error;
                }
            );
        };

        getSelectionGroupsFromService();

        $scope.getSelectionGroups = function () {
            return $scope.selectionGroups;
        };

        $scope.createGroup = function () {
            var newSelectionGroup = SelectAreaService.addSelectionGroup();
            $scope.editSelectionGroup(null, newSelectionGroup);
        };

        $scope.alreadyInEditMode = function () {
            for (var key in $scope.selectionGroups) {
                if ($scope.selectionGroups[key].editMode === true) {
                    return true;
                }
            }
        };

        $scope.selectionGroupClear = function ($event, selectionGroup) {
            $event.preventDefault();
            NotifyService.notify(SelectAreaEvents.ClearAreas);
            // selectionLayer.clearFeatures();
            selectionGroup.squares = [];

        };

        $scope.selectionGroupDelete = function ($event, selectionGroup) {
            $event.preventDefault();
            NotifyService.notify(SelectAreaEvents.ClearAreas);
            NotifyService.notify(SelectAreaEvents.DoneEdit);
            // selectionLayer.clearFeatures();
            // selectionLayer.deactivateModify();


            for (var i = 0; i < $scope.selectionGroups.length; i++) {
                if ($scope.selectionGroups[i].name === selectionGroup.name) {
                    $scope.selectionGroups.splice(i, 1);
                    break;
                }
            }
        };

        $scope.editSelectionGroup = function ($event, selectionGroup) {
            if ($event) {
                $event.preventDefault();
            }
            selectionGroup.editMode = true;
            NotifyService.notify(SelectAreaEvents.StartEdit);
            $scope.deregistrationFunction = NotifyService.subscribe($scope, SelectAreaEvents.AreaCreated, function (e, area) {
                selectionGroup.squares.push(area);
            });
            // selectionLayer.activateModify();

            for (var key in $scope.selectionGroups) {
                var currentGroup = $scope.selectionGroups[key];
                if (currentGroup.name !== selectionGroup.name) {
                    currentGroup.editMode = false;
                }
            }

            NotifyService.notify(SelectAreaEvents.ShowArea, selectionGroup);
            // selectionLayer.draw(selectionGroup);
        };

        var isSelectionGroupUnique = function () {
            for (var i = 0; i < $scope.selectionGroups.length; i++) {
                for (var j = 0; j < $scope.selectionGroups.length; j++) {
                    if (i !== j) {
                        if ($scope.selectionGroups[i].name === $scope.selectionGroups[j].name) {
                            return false;
                        }
                    }
                }
            }
            return true;
        };

        $scope.selectionGroupDone = function ($event, selectionGroup) {
            $event.preventDefault();
            $scope.alertMessages = [];
            if (isSelectionGroupUnique()) {
                NotifyService.notify(SelectAreaEvents.DoneEdit);
                if ($scope.deregistrationFunction) {
                    $scope.deregistrationFunction();
                }
                // selectionGroup.squares = selectionLayer.getSquareBounds();
                // selectionLayer.deactivateModify();
                selectionGroup.editMode = false;
                // selectionLayer.clearFeatures();
            } else {
                $scope.alertMessages = ["The chosen area name is not unique."];
            }
        };

        $scope.updateSelectionGroups = function () {
            var selectionGroupsForService = [];

            for (key in $scope.selectionGroups) {
                var selectionGroup = $scope.selectionGroups[key];

                var SelectionGroupForService = {
                    id: 1,
                    name: selectionGroup.name,
                    active: selectionGroup.active,
                    polygonsAsJson: JSON.stringify(selectionGroup.squares)
                };

                selectionGroupsForService.push(SelectionGroupForService);
            }
            SelectAreaService.updateSelectionGroups(
                selectionGroupsForService,
                function () {
                    //TODO: only update if modified
                    SubscriptionService.update({name: 'VesselService.list'});
                },
                function (error) {
                    $scope.alertMessages.push(error);
                });
        };

        $scope.$on("$destroy", function () {
            NotifyService.notify(SelectAreaEvents.SelectAreaInActive);
        });

    }
})();