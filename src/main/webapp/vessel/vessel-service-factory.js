(function () {
    'use strict';

    angular
        .module('embryo.vessel')
        .factory('VesselServiceFactory', VesselServiceFactory);

    VesselServiceFactory.$inject = ['NotifyService', 'VesselEvents'];

    function VesselServiceFactory(NotifyService, VesselEvents) {
        function createService(serv, scope) {
            var vesselOverview = scope.vesselOverview || scope.selected.vesselOverview;
            var vesselInformation = scope.vesselInformation || scope.selected.vesselInformation;
            var vesselDetails = scope.vesselDetails || scope.selected.vesselDetails;
            var available = serv.available(vesselOverview, vesselDetails);

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
                            vesselInformation.show(this.service, vesselOverview, vesselDetails);
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

            }

        }

        return {
            createService: function (service, scope) {
                return createService(service, scope);
            },
            createNearestShips: function (scope) {
                NotifyService.subscribe(scope, VesselEvents.ShowNearestVessels, function () {
                    service.isShown = true;
                });
                NotifyService.subscribe(scope, VesselEvents.HideNearestVessels, hide);
                NotifyService.subscribe(scope, VesselEvents.HideExtraVesselsInfo, hide);
                function hide() {
                    service.isShown = false;
                }

                var service = {
                    title : "Nearest Vessels",
                    isShown: false,
                    available : function() {
                        var vessels = embryo.vessel.allVessels();
                        return !!vessels.find(function (v) {
                            return !!embryo.getMaxSpeed(v);
                        });
                    },
                    show : function(vessel) {
                        NotifyService.notify(VesselEvents.ShowNearestVessels, {selected: vessel, vessels: embryo.vessel.allVessels()});
                    },
                    hide : function() {
                        NotifyService.notify(VesselEvents.HideNearestVessels);
                    },
                    shown : function() {
                        return this.isShown;
                    },
                    hideAll : function() {
                        console.log("hideAll called");
                    }
                };
                return createService(service, scope);
            },
            createDistanceCircles: function (scope) {
                NotifyService.subscribe(scope, VesselEvents.ShowDistanceCircles, function () {
                    service.isShown = true;
                });
                NotifyService.subscribe(scope, VesselEvents.HideDistanceCircles, hide);
                NotifyService.subscribe(scope, VesselEvents.HideExtraVesselsInfo, hide);

                function hide() {
                    service.isShown = false;
                }

                var service = {
                    title : "3-6-9 hour distance circle based on SOG",
                    isShown : false,
                    available : function(vessel) {
                        return embryo.getMaxSpeed(vessel) > 0;
                    },
                    show : function(vessel) {
                        NotifyService.notify(VesselEvents.ShowDistanceCircles, vessel);
                    },
                    hide : function() {
                        NotifyService.notify(VesselEvents.HideDistanceCircles);
                    },
                    shown : function() {
                        return this.isShown;
                    },
                    hideAll : function() {
                        this.hide()
                    }
                };
                return createService(service, scope);
            },
            createRoute: function (scope) {
                NotifyService.subscribe(scope, VesselEvents.HideExtraVesselsInfo, hide);

                function hide() {
                    service.isShown = false;
                }

                var service = {
                    title: "Route",
                    isShown: false,
                    available: function (vessel, vesselDetails) {
                        return vesselDetails.additionalInformation.routeId !== null;
                    },
                    show: function (vessel, vesselDetails) {
                        NotifyService.notify(VesselEvents.ShowRoute, vesselDetails.additionalInformation.routeId);
                        this.isShown = true;
                    },
                    hide: function () {
                        NotifyService.notify(VesselEvents.HideRoute);
                        this.isShown = false;
                    },
                    shown: function () {
                        return this.isShown;
                    },
                    hideAll: function () {
                        this.hide();
                    }

                };
                return createService(service, scope);
            }
        }
    }
})();