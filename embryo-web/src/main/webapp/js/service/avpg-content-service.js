(function () {
    "use strict";

    var module = angular.module('embryo.avpg.content.service', []);

    module.service('AVPGContentService', ['$log', function ($log) {
        var that = this;
        var contentDb = {
            "1": {
                "title": "Navigational Warnings Services",
                "url": "partials/avpg/navigational_warnings_services.html"
            },
            "2": {
                "title": "Radio Aids to Navigation",
                "url": "partials/avpg/navigational_warnings_services.html"
            },
            "3": {
                "title": "List of Lights and Buoys and Aids to Navigation",
                "url": "partials/avpg/aton-introduction.html"
            },
            "4": {
                "title": "Nautical Charts and Publications services",
                "url": "partials/avpg/nautical_charts_and_publications_services.html"
            },
            "5": {
                "title": "Acts and Regulations specific to marine navigation (similar to S-49 E.3.2)",
                "url": "partials/avpg/acts-and-regulations.html"
            },
            "6": {
                "title": "IMO Guidelines for Operating in Polar Waters",
                "url": "partials/avpg/imo-guidelines.html"
            },
            "12": {
                "title": "Controlled Navigational Areas including Vessel Traffic Services Zones",
                "url": "partials/avpg/controlled-navigational-areas.html"
            },
            "13": {
                "title": "Limiting Depth For Constricted Waterways",
                "url": "partials/avpg/limiting-depth-for-constricted-waterways.html"
            },
            "14": {
                "title": "Tide, Current and Water Level information (similar to S-49 U.6.1)",
                "url": "partials/avpg/tide-current-and-water-level-information.html"
            },
            "16": {
                "title": "Major Aids to Navigations (similar to S-49 E.1.2 and U.1.2)",
                "url": "partials/avpg/aton-introduction.html"
            },
            "17": {
                "title": "Places of refuge or Pilot Boarding Stations (similar to S-49 E.1.5)",
                "url": "partials/avpg/controlled-navigational-areas.html"
            },
            "18": {
                "title": "Calling-in Points (similar to S-49 E.4.1)",
                "url": "partials/avpg/calling-in-points.html"
            },
            "19": {
                "title": "Areas of Legislative Importance to Navigation",
                "url": "partials/avpg/calling-in-points.html"
            },
            "20": {
                "title": "Marine Communication Services (similar calling-in info to S-49 E.4.1)",
                "url": "partials/avpg/calling-in-points.html"
            },
            "21": {
                "title": "Ice Breaking Support Services",
                "url": "partials/avpg/ice-breaking-support-services.html"
            },
            "22": {
                "title": "Search and Rescue Support Services",
                "url": "partials/avpg/search-and-rescue-support-services.html"
            },
            "23": {
                "title": "Ice Services Information (similar to S-49 U.6.4)",
                "url": "partials/avpg/ice-services-information.html"
            },
            "24": {
                "title": "Nautical Chart Catalogue and Coverage",
                "url": "partials/avpg/nautical-chart-catalogue-and-coverage.html"
            },
            "25": {
                "title": "Publication Catalogue and Coverage",
                "url": "partials/avpg/publication-catalogue-and-coverage.html"
            },
            "default": {
                "title": "No content",
                "url": "partials/avpg/missing_content.html"
            }
        };

        that.getContentById = function(contentId) {
            var result = contentDb["default"];
            if (contentId && contentDb[contentId]) {
                result = contentDb[contentId];
            }

            return result;
        }
    }]);
})();