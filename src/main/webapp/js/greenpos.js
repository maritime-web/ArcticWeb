/*
 * Dependencies:
 * 
 * aisview.js
 * aisviewUI.js
 * position.js
 * ....
 */

(function() {
	"use strict";

	var greenposModule = angular.module('embryo.greenpos',['embryo.voyageService', 'embryo.greenposService', 'embryo.shipService']);

	/*
	 * Inspired by http://jsfiddle.net/zbjLh/2/
	 */
	greenposModule.directive('resize', function($window) {
		return {
			restrict : 'A',
			link : function(scope, element, attrs) {

				var elemToMatch = $('#' + attrs.resize);
				scope.getElementDimensions = function() {
					return {
						'h' : elemToMatch.height(),
						'w' : elemToMatch.width(),
					};
				};
				scope.$watch(scope.getElementDimensions, function(newValue,
						oldValue) {

					scope.style = function() {
						return {
							'height' : (newValue.h) + 'px',
							'width' : (newValue.w) + 'px'
						};
					};
				}, true);

				var window = angular.element($window);
				window.bind('resize', function() {
					scope.$apply(function() {
					});
				});
			}
		};
	});

	embryo.GreenPosCtrl = function($scope, ShipService, VoyageService,
			GreenPosRest, AisRestService) {

		$scope.projection = "EPSG:4326";

		$scope.visibility = {
			"SP" : [ "destination", "etaOfArrival", "personsOnBoard", "course",
					"speed", "weather", "ice" ],
			"PR" : [ "course", "speed", "weather", "ice" ],
			"FR" : [ "weather", "ice" ],
			"DR" : [ "deviation" ]
		};

		$scope.report = {
			reportType : "SP",
		};

		ShipService.getYourShip(function(yourShip) {
			$scope.report.shipMmsi = yourShip.mmsi;
			$scope.report.shipCallSign = yourShip.callSign;
			$scope.report.shipName = yourShip.name;
			$scope.report.shipMaritimeId = yourShip.maritimeId;
		});

		VoyageService.getYourActive(function(voyage) {
			$scope.report.destination = voyage.berthName;
			$scope.report.etaOfArrival = voyage.arrival;
			$scope.report.personsOnBoard = voyage.personsOnBoard;
		});

		$scope.$on('$viewContentLoaded', function() {
			if (!$scope.map) {
				// postpone map loading sligtly, to let the resize directive set
				// the
				// sizes of the map container divs, before map loading. If not
				// done,
				// the
				// map is not loaded in correct size
				setTimeout(function() {
					$scope.$apply(function() {
						$scope.loadMap();
					});
				}, 100);
			}
		});

		$scope.isVisible = function(fieldName) {
			if (!$scope.report || !$scope.report.reportType) {
				return true;
			}
			var fields = $scope.visibility[$scope.report.reportType];

			return fields.indexOf(fieldName) > -1;
		};

		// can speed and course be preset with ais data?

		$scope.isShip = function() {
			return true;
		};

		$scope.sendReport = function() {
			console.log('trying to send report');
			GreenPosRest.save($scope.report, function() {
				$scope.message = "GreenPos report successfully submitted";
				console.log("GreenPos successfully submitted");
			});
		};

		$scope.cancel = function() {
			console.log($scope.greenPosForm.gpCourse.$error.required);
			console.log($scope.greenPosForm.gpCourse.$error);
		};

		$scope.clear = function() {

		};

		$scope.getLatLon = function() {
			return {
				lat : $scope.report.latitude,
				lon : $scope.report.longitude
			};
		};

		$scope.$watch($scope.getLatLon, function(newValue, oldValue) {
			if (newValue.lat && newValue.lon) {
				$scope.setPositionOnMap(newValue.lat, newValue.lon);
			}
		}, true);

		$scope.getShip = function() {
			return {
				maritimeId : $scope.report.shipMaritimeId,
				name : $scope.report.shipName,
				mmsi : $scope.report.shipMmsi,
				callSign : $scope.report.shipCallSign
			};
		};

		$scope.$watch($scope.getShip, function(newValue, oldValue) {
			if (newValue.mmsi) {
				var searchResult = AisRestService.findVesselsByMmsi({
					mmsi : newValue.mmsi
				}, function() {
					var vessels = [];
					for ( var vesselId in searchResult.vessels) {
						var vesselJSON = searchResult.vessels[vesselId];
						var vessel = new Vessel(vesselId, vesselJSON, 1);
						vessels.push(vessel);
					}
					$scope.setVesselsOnMap(vessels);
				});
			}
		}, true);

		$scope.setVesselsOnMap = function(vessels) {
			var features = [];
			for ( var index in vessels) {
				var value = vessels[index];
				var attr = {
					id : value.id,
					angle : value.degree - 90,
					opacity : 1,
					image : "img/" + value.image,
					imageWidth : value.imageWidth,
					imageHeight : value.imageHeight,
					imageYOffset : value.imageYOffset,
					imageXOffset : value.imageXOffset,
					type : "vessel",
					vessel : value
				};

				// transform from WGS 1984 to Spherical Mercator Projection
				var geom = new OpenLayers.Geometry.Point(value.lon, value.lat)
						.transform(
								new OpenLayers.Projection($scope.projection),
								$scope.map.getProjectionObject());

				// Use styled vector points
				features.push(new OpenLayers.Feature.Vector(geom, attr));
			}

			$scope.vesselLayer.removeAllFeatures();
			$scope.vesselLayer.addFeatures(features);
			$scope.vesselLayer.refresh();
		};

		$scope.loadMap = function() {
			$scope.map = new OpenLayers.Map({
				div : "greenPosMap",
				projection : 'EPSG:900913',
				fractionalZoom : false
			});

			var osm = new OpenLayers.Layer.OSM("OSM",
					"http://a.tile.openstreetmap.org/${z}/${x}/${y}.png", {
						'layers' : 'basic',
						'isBaseLayer' : true
					});
			$scope.map.addLayer(osm);

			var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
			renderer = (renderer) ? [ renderer ]
					: OpenLayers.Layer.Vector.prototype.renderers;

			var defTemplate = OpenLayers.Util.applyDefaults({
				strokeWidth : 2,
				strokeColor : "blue", // using context.getColor(feature)
				fillColor : "blue", // using context.getColor(feature)
				graphicName : "x",
				pointRadius : 5
			}, OpenLayers.Feature.Vector.style["default"]);

			$scope.pointLayer = new OpenLayers.Layer.Vector("pointLayer", {
				styleMap : new OpenLayers.StyleMap({
					'default' : defTemplate
				}),
				renderes : renderer
			});

			$scope.vesselLayer = new OpenLayers.Layer.Vector("staticLayer", {
				styleMap : new OpenLayers.StyleMap({
					"default" : {
						externalGraphic : "${image}",
						graphicWidth : "${imageWidth}",
						graphicHeight : "${imageHeight}",
						graphicYOffset : "${imageYOffset}",
						graphicXOffset : "${imageXOffset}",
						rotation : "${angle}",
						strokeDashstyle : 'dash',
						strokeColor : "red", // using
						// context.getColor(feature)
						strokeWidth : 3
					// strokeOpacity
					},
					"select" : {
						cursor : "crosshair",
						externalGraphic : "${image}"
					}
				}),
				renderers : renderer
			});
			$scope.map.addLayer($scope.vesselLayer);
			$scope.map.addLayer($scope.pointLayer);

			var initialLat = 74.00;
			var initialLon = -40.0;
			var initialZoom = 3;

			var center = $scope.transformPosition(initialLon, initialLat);
			$scope.map.setCenter(center, initialZoom);
		};

		$scope.setPositionOnMap = function(latitude, longitude) {
			if ($scope.pointLayer) {
				var lat = embryo.geographic.parseLatitude(latitude);
				var lon = embryo.geographic.parseLongitude(longitude);

				var point = new OpenLayers.Geometry.Point(lon, lat).transform(
						new OpenLayers.Projection($scope.projection),
						$scope.map.getProjectionObject());

				var pointFeature = new OpenLayers.Feature.Vector(point);
				$scope.pointLayer.removeAllFeatures();
				$scope.pointLayer.addFeatures([ pointFeature ]);
				$scope.pointLayer.refresh();
			}
		};

		$scope.transformPosition = function(lon, lat) {
			// transform from WGS 1984 to Spherical Mercator Projection
			return new OpenLayers.LonLat(lon, lat).transform(
					new OpenLayers.Projection($scope.projection), $scope.map
							.getProjectionObject());
		};
	};

	embryo.GreenPosListCtrl = function($scope, ShipService, VoyageService,
			GreenPosRest, AisRestService) {

		$scope.$on('$viewContentLoaded', function() {
			if (!$scope.map) {
//				var reports = GreenPosRest.list(function() {
//					$scope.reports = reports;
//				});

				// postpone map loading sligtly, to let the resize directive set
				// the sizes of the map container divs, before map loading. If
				// not done, the map is not loaded in correct size
//				setTimeout(function() {
//					$scope.$apply(function() {
//						$scope.loadMap();
//					});
//				}, 100);
			}
		});

	};

}());