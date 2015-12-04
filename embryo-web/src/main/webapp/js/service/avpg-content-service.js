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