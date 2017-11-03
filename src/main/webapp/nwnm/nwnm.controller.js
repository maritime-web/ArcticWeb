(function () {

    angular.module('embryo.nwnm')
        .controller("NWNMControl", ['$scope', 'NWNMService', 'NWNMEvents', 'NotifyService', 'Subject', '$timeout', function ($scope, NWNMService, NWNMEvents, NotifyService, Subject, $timeout) {
            NotifyService.notify(NWNMEvents.NWNMFeatureActive);
            $scope.unfilteredMmessages = [];
            $scope.messages = [];
            $scope.selected = {};
            $scope.state = {};
            $scope.state.showOnlyActive = false;
            $scope.state.showNW = true;
            $scope.state.showNM = false;

            console.log("INITIALIZING NWNM");

            initialize();

            function initialize() {
                if (Subject.isLoggedIn()) {
                    /**
                     * Subscribe to notifications on NW-NM message loading.
                     */
                    NWNMService.subscribe(function (error, messages) {
                        if (error) {
                            embryo.messagePanel.show({
                                text: error,
                                type: "error"
                            });
                        } else {
                            $scope.unfilteredMmessages = messages;
                            var state = NWNMService.getFilterState();
                            if (state) {
                                $scope.state = state;
                            }

                            onStateChange();
                        }
                    });
                } else {
                    $timeout(function () {
                        $scope.$apply(function () {
                            initialize();
                        });
                    }, 10)
                }
            }

            /**
             * Filter messages according to the currently chosen filter criteria.
             * @param messages unfiltered list of NW-NM messages
             */
            function filter(messages) {
                return messages.filter(function (msg) {
                    return activeFilter(msg) && nwFilter(msg) && nmFilter(msg) && areaFilter(msg);
                });

                function activeFilter(msg) {
                    return !$scope.state.showOnlyActive || msg.isActive;
                }

                function nmFilter(msg) {
                    return $scope.state.showNM || msg.mainType !== "NM";
                }

                function nwFilter(msg) {
                    return $scope.state.showNW || msg.mainType !== "NW";
                }

                function areaFilter(msg) {
                    return (msg.mainArea && msg.mainArea.mrn === $scope.state.showArea) || !msg.mainArea || !msg.mainArea.mrn;
                }
            }

            /**
             * Called whenever messages are loaded from the server or any filter changes.
             */
            $scope.stateChanged = function () {
                onStateChange();
            };

            $scope.$watch("state.showArea", function (oldVal, newVal) {
                if (oldVal !== newVal) {
                    NotifyService.notify(NWNMEvents.AreaChosen, $scope.state.showArea);
                }
            });

            function onStateChange() {
                $scope.mainAreas = extractMainAreas();

                if (!$scope.state.showArea) {
                    $scope.state.showArea = $scope.mainAreas[0].mrn;
                }

                NWNMService.setFilterState($scope.state);
                $scope.messages = filter($scope.unfilteredMmessages);
                NotifyService.notify(NWNMEvents.MessagesUpdated, $scope.messages);
            }

            function extractMainAreas() {
                var mrns = new Set();
                return $scope.unfilteredMmessages.map(function (m) {
                    var area = null;
                    if (m.areas && m.areas.length > 0) {
                        area = m.areas[0];

                        while (area.parent) {
                            area = area.parent;
                        }
                    }
                    return area;
                }).filter(function (area) {
                    if (!area || !area.mrn) {
                        return false;
                    }

                    var mrn = area.mrn;
                    if (mrns.has(mrn)) {
                        return false;
                    } else {
                        mrns.add(mrn);
                        return true;
                    }
                });
            }

            $scope.showMsg = function () {
                NWNMService.update();
            };

            $scope.formatDate = function (timeInMillis) {
                return formatDate(timeInMillis);
            };

            $scope.selectMsg = function (msg) {
                NotifyService.notify(NWNMEvents.MessageSelected, msg);
            };

            /**
             * listen to map select events
             */
            NotifyService.subscribe($scope, NWNMEvents.MessageSelected, function (e, msg) {
                $scope.selected.open = !!msg;
                $scope.selected.msg = msg;
            });

            $scope.$on('$destroy', function () {
                NotifyService.notify(NWNMEvents.NWNMFeatureInActive);
            })
        }]);
})();
