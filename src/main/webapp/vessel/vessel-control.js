embryo.vessel = {};

/*
embryo.eventbus.VesselSelectedEvent = function(id) {
    var event = jQuery.Event("VesselSelectedEvent");
    event.vesselId = id;
    return event;
};

embryo.eventbus.VesselUnselectedEvent = function() {
    var event = jQuery.Event("VesselUnselectedEvent");
    return event;
};

embryo.eventbus.registerShorthand(embryo.eventbus.VesselSelectedEvent, "vesselSelected");
embryo.eventbus.registerShorthand(embryo.eventbus.VesselUnselectedEvent, "vesselUnselected");
*/

//TODO REMOVE ASAP
embryo.global = {};
embryo.global.vessels = null;

$(function() {

    var vesselLayer;
    var selectedId = null;

/*
    embryo.postLayerInitialization(function(){
        vesselLayer = new VesselLayer({clusteringEnabled: true});
        addLayerToMap("vessel", vesselLayer, embryo.map);


        vesselLayer.select(function(id) {
            if (selectedId != id && selectedId != null)
                embryo.eventbus.fireEvent(embryo.eventbus.VesselUnselectedEvent());
            if (id)
                embryo.eventbus.fireEvent(embryo.eventbus.VesselSelectedEvent(id));
            else
                embryo.eventbus.fireEvent(embryo.eventbus.VesselUnselectedEvent());
            selectedId = id;
        });
    })
*/

    embryo.vessel.lookupVessel = function(id) {
        for ( var i in embryo.global.vessels) {
            if (embryo.global.vessels[i].mmsi == id)
                return embryo.global.vessels[i];
        }
        return null;
    };

    embryo.vessel.allVessels = function() {
        return embryo.global.vessels;
    };

});

$(function() {

    var module = angular.module('embryo.vessel.control', [ 'embryo.vessel.service' ]);

    embryo.vessel.aisToArray = function(aisObject) {
        var result = [];
        $.each(aisObject, function(k, v) {
            if (v != null && v != "") {
                result.push({
                    text: k,
                    value: v
                });
            }
        });
        return result;
    };

    var navStatusTexts = {
        0: "Under way using engine",
        1: "At anchor",
        2: "Not under command",
        3: "Restricted manoeuvrability",
        4: "Constrained by her draught",
        5: "Moored",
        6: "Aground",
        7: "Engaged in fishing",
        8: "Under way",
        12: "Power-driven vessel pushing ahead or towing alongside",
        14: "Ais SART",
        15: "Undefined"
    };

    embryo.vessel.navStatusText = function (navStatus) {
        if (navStatus && navStatusTexts.hasOwnProperty(navStatus)) {
            return navStatusTexts[navStatus]
        }
        return null;
    };


    embryo.vessel.createSorter = function(nameSequence) {
        var sorter = function(service1, service2) {
            var i1 = "" + nameSequence.indexOf(service1.name);
            var i2 = "" + nameSequence.indexOf(service2.name);
            return i1 - i2;
        };
        return sorter;
    };

    embryo.vessel.createFilter = function(nameSequence, subFilter) {
        var filter = function(provider, index, array) {
            return nameSequence.indexOf(provider.title) >= 0 && subFilter(provider, index, array);
        };
        return filter;
    };

    embryo.vessel.controllers = {};
    embryo.vessel.controllers.service = function(serv, scope) {
        var available = serv.available(scope.vesselOverview, scope.vesselDetails);

        return {
            service : serv,
            scope : scope,
            name : serv.title,
            type : (available.action ? 'edit' : 'view'),
            statusText : function() {
                switch (available) {
                case false:
                    return 'NOT AVAILABLE';
                case true:
                    return 'AVAILABLE';
                default:
                    return (available.text);
                }
            },
            statusClass : function() {
                switch (available) {
                case false:
                    return 'label-default';
                case true:
                    return 'label-success';
                default:
                    if (available.klass) {
                        return "label-" + available.klass;
                    }
                    return 'label-default';
                }
            },
            alert : function() {
                if (this.service.close && this.service.shown
                        && this.service.shown(vesselOverview, vesselDetails)) {
                    return 'alert-success';
                } else if (this.service.hide && this.service.shown
                        && this.service.shown(vesselOverview, vesselDetails)) {
                    return 'alert-warning';
                }
                return '';
            },
            text : function() {
                if (this.type === 'edit') {
                    return 'edit';
                }
                if (this.service.hide && this.service.shown
                        && this.service.shown(vesselOverview, vesselDetails)) {
                    return "hide";
                }

                return "view";
            },
            toggle : function($event) {
                $event.preventDefault();
                if (this.service.close) {
                    if (this.service.shown(vesselOverview, vesselDetails)) {
                        vesselInformation.hide(this.service);
                    } else {
                        vesselInformation.show(this.service, vesselOverview,
                                vesselDetails);
                    }
                } else if (this.service.hide) {
                    if (this.service.shown(vesselOverview, vesselDetails)) {
                        this.service.hide(vesselOverview, vesselDetails);
                    } else {
                        vesselInformation.hideAll();
                        this.service.show(vesselOverview, vesselDetails);
                    }
                }

            }

        };
    };

    function vesselAis(data) {
        if (!data.aisVessel) {
            return null;
        }

        return embryo.vessel.aisToArray({
            "MMSI" : data.aisVessel.mmsi,
            "Class" : data.aisVessel["class"],
            "Call Sign" : data.aisVessel.callsign,
            "Vessel Type" : data.aisVessel.vesselType,
            "Cargo" : data.aisVessel.cargo != "N/A" && data.aisVessel.cargo != "Undefined" ? data.aisVessel.cargo : null,
            "Country" : data.aisVessel.country,
            "SOG" : data.aisVessel.sog,
            "COG" : data.aisVessel.cog,
            "Destination" : data.aisVessel.destination,
            "Nav Status": embryo.vessel.navStatusText(data.aisVessel.navStatus),
            "ETA": data.aisVessel.eta ? formatTime(data.aisVessel.eta) + " UTC" : ""
        });
    }


    module.controller("VesselController", [
            '$scope',
            'VesselService',
            'VesselInformation',
            'NotifyService',
            'VesselEvents',
            'VesselServiceFactory',
            function($scope, VesselService, VesselInformation, NotifyService, VesselEvents, VesselServiceFactory) {
                this.scope = $scope;

                $scope.selected = {};
                $scope.vesselScope = {};
                $scope.vesselInformation = VesselInformation;

                $scope.viewAis = function($event) {
                    $event.preventDefault();
                    VesselInformation.hideAll();
                    embryo.controllers.ais.show($scope.selected.vesselDetails.aisVessel);
                };

                $scope.$watch('selected.vesselOverview', function(newValue, oldValue) {
                    $scope.selected.sections = initSelectedSections();
                }, true);

                $scope.$watch('selected.vesselDetails', function(newValue, oldValue) {
                    $scope.selected.sections = initSelectedSections();
                }, true);

                $scope.selectedDrawnOnMap = function() {
                    var selectedActions = embryo.vessel.actions.selectedVessel();

                    for ( var index in selectedActions) {
                        if (typeof selectedActions[index] == 'object') {
                            if (selectedActions[index] && selectedActions[index].shown
                                    && selectedActions[index].shown()) {
                                return true;
                            }
                        }
                    }
                    return false;
                };
                $scope.clearSelectedOnMap = function($event) {
                    $event.preventDefault();

                    var selectedActions = embryo.vessel.actions.selectedVessel();
                    for ( var index in selectedActions) {
                        if (typeof selectedActions[index] == 'object') {
                            if (selectedActions[index] && selectedActions[index].hideAll) {
                                selectedActions[index].hideAll();
                            }
                        }
                    }
                };
                $scope.$on("$destroy", function() {
                    VesselInformation.hideAll();
                });

                NotifyService.subscribe($scope, VesselEvents.VesselClicked, onVesselChosen);
                NotifyService.subscribe($scope, VesselEvents.VesselSelected, onVesselChosen);
                function onVesselChosen (e, vessel) {
                    NotifyService.notify(VesselEvents.HideExtraVesselsInfo);
                    VesselInformation.hideAll();
                    $scope.selected.open = true;

                    $scope.selected.vesselName = "loading data";
                    $scope.selected.loadingMmsi = vessel.mmsi;

                    VesselService.details(vessel.mmsi, function (vesselDetails) {
                        $scope.selected.vesselInformation = VesselInformation;
                        $scope.selected.vesselAis = vesselAis(vesselDetails);
                        $scope.selected.vesselOverview = vessel;
                        $scope.selected.vesselName = $scope.selected.vesselOverview.name;
                        $scope.selected.vesselDetails = vesselDetails;

                        delete $scope.selected.loadingMmsi;
                    }, function (errorMsg, status) {
                        embryo.messagePanel.show({
                            text: errorMsg,
                            type: "error"
                        });
                        delete $scope.selected.loadingMmsi;
                    });
                    if (!$scope.$$phase) {
                        $scope.$apply(function () {
                        });
                    }
                }


                var awNameSequence = [ "Vessel Information", "Schedule", "Route", "Reports" ];
                var awSorter = embryo.vessel.createSorter(awNameSequence);
                var awFilter = embryo.vessel.createFilter(awNameSequence, function(provider, index, array) {
                    return provider.type === 'view';
                });

                function initSelectedSections() {
                    if (!$scope.selected.vesselOverview || !$scope.selected.vesselDetails) {
                        return [];
                    }

                    var sections = [ {
                        name : "ArcticWeb Reporting",
                        services : [],
                        type : "view"
                    }, {
                        name : "Additional Information",
                        services : [],
                        type : "view"
                    } ];

                    var vesselInformation = $scope.vesselInformation.getVesselInformation().filter(awFilter);
                    for ( var i in vesselInformation) {
                        sections[0].services.push(VesselServiceFactory.createService(vesselInformation[i], $scope));
                    }
                    sections[0].services.push(VesselServiceFactory.createRoute($scope));
                    sections[0].services.sort(awSorter);

                    sections[1].services.push(VesselServiceFactory.createNearestShips($scope));
                    sections[1].services.push(VesselServiceFactory.createDistanceCircles($scope));

                    return sections;
                }


            } ]);

    module.controller("SearchVesselController", [ '$scope', 'VesselService', 'NotifyService', 'VesselEvents',  function($scope, VesselService, NotifyService, VesselEvents) {
        $scope.searchResults = [];
        $scope.searchResultsLimit = 10;

        $scope.$watch('searchField', function(newValue, oldValue) {
            if (newValue && newValue !== oldValue) {
                VesselService.clientSideSearch($scope.searchField, function(searchResults) {
                    $scope.searchResults = searchResults;
                });
            }
        });
        $scope.select = function($event, vessel) {
            $event.preventDefault();

            NotifyService.notify(VesselEvents.VesselSelected, vessel);
        };
    } ]);

    module.controller("MapInformationController", [ '$scope', 'NotifyService', 'VesselEvents', function($scope, NotifyService, VesselEvents) {
        var shownCounter = 0;
        NotifyService.subscribe($scope, VesselEvents.ShowNearestVessels, up);
        NotifyService.subscribe($scope, VesselEvents.ShowDistanceCircles, up);
        NotifyService.subscribe($scope, VesselEvents.ShowRoute, up);
        function up() {
            shownCounter++;
        }
        NotifyService.subscribe($scope, VesselEvents.HideNearestVessels, down);
        NotifyService.subscribe($scope, VesselEvents.HideDistanceCircles, down);
        NotifyService.subscribe($scope, VesselEvents.HideRoute, down);
        function down() {
            shownCounter--;
        }
        NotifyService.subscribe($scope, VesselEvents.HideExtraVesselsInfo, function () {
            shownCounter = 0;
        });

        $scope.selectedDrawnOnMap = function() {
            return shownCounter > 0;
        };
        $scope.clearSelectedOnMap = function($event) {
            $event.preventDefault();

            NotifyService.notify(VesselEvents.HideExtraVesselsInfo);
        };
    } ]);

    embryo.authenticated(function () {
        embryo.subscription.service.subscribe({
            subscriber: "vesselLayerController",
            name: "VesselService.list",
            fn: embryo.vessel.service.list,
            interval: embryo.loadFrequence,
            success: function (data) {
                embryo.global.vessels = data;
            }
        });

    });
});
