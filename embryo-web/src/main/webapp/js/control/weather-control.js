$(function() {

    embryo.groupChanged(function(e) {
        if (e.groupId == "weather") {
            $("#weatherControlPanel").css("display", "block");
            $("#weatherControlPanel .collapse").data("collapse", null);
            openCollapse("#weatherControlPanel .accordion-body:first");
        } else {
            $("#weatherControlPanel").css("display", "none");
        }
    });

    var metocLayer = new MetocLayer();
    addLayerToMap("weather", metocLayer, embryo.map);

    var module = angular.module('embryo.weather.control', [ 'embryo.metoc', 'ui.bootstrap.accordion' ]);

    module.controller("WeatherController", [
            '$scope',
            'RouteService',
            'MetocService',
            function($scope, RouteService, MetocService) {
                $scope.routes = [];
                $scope.selectedOpen = false;

                function available(route) {
                    return Math.abs((route.etaDep - Date.now()) < 1000 * 3600 * 55) || Date.now() < route.eta;
                }

                if (embryo.authentication.shipMmsi) {
                    $scope.routes.push({
                        name : 'Active route',
                        available : false,
                        ids : null
                    });

                    RouteService.getActiveMeta(embryo.authentication.shipMmsi, function(route) {
                        $scope.routes[0].available = available(route);
                        $scope.routes[0].ids = [ route.id ];
                    });
                }

                $scope.routes.push({
                    name : 'Selected routes',
                    available : false,
                    ids : []
                });

                $scope.$watch(RouteService.getSelectedRoutes, function(newValue, oldValue) {
                    
                    var routes = RouteService.getSelectedRoutes();
                    
                    console.log("watch");
                    
                    for ( var index in routes) {
                        if (available(routes[index])){
                            console.log("available");
                            console.log(routes[index]);
                            $scope.routes[$scope.routes.length - 1].available = true;
                            $scope.routes[$scope.routes.length - 1].ids.push(routes[index].id);
                        }
                    }
                });
                
                

                $scope.toggleShowMetoc = function($event, route) {
                    $event.preventDefault();
                    metocLayer.clear();
                    if (!$scope.shown || $scope.shown.name !== route.name) {
                        MetocService.listMetoc(route.ids, function(metocs) {
                            $scope.shown = route;
                            metocLayer.draw(metocs);
                            metocLayer.zoomToExtent();
                        });
                    } else {
                        $scope.shown = null;
                        $scope.selected = null;
                        $scope.selectedOpen = false;
                    }
                };

                metocLayer.select("metocCtrl", function(forecast) {
                    $scope.selected = forecast;
                    $scope.selectedOpen = true;

                    $scope.$apply(function() {
                    });
                });

            } ]);

    // var iceLayer = new IceLayer();
    //
    // addLayerToMap("ice", iceLayer, embryo.map);
    //
    // iceLayer.select(function(ice) {
    // if (ice != null) {
    // showIceInformation(ice);
    // } else {
    // hideIceInformation();
    // }
    // });
    //
    embryo.ready(function() {
        function fixAccordionSize() {
            $("#weatherControlPanel .e-accordion-inner").css("overflow", "auto");
            $("#weatherControlPanel .e-accordion-inner").css("max-height",
                    Math.max(100, $(window).height() - 233) + "px");
        }

        $(window).resize(fixAccordionSize);

        fixAccordionSize();
    });
});
