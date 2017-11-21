$(function() {

    var module = angular.module('embryo.components.render');

    module.directive('eReportingPanel', [ '$window', function($window) {
        return {
            restrict : 'A',
            link : function(scope, element, attrs) {
                // add scroll bars
                element.addClass('e-reporting-panel well');
                
                function fixReportingPanelSize() {
                    element.css("overflow", "auto");
                    element.css("max-height", Math.max(100, $("body").height() - 100) + "px");
                }

                jQuery($window).resize(fixReportingPanelSize);
                fixReportingPanelSize();
            }
        };
    } ]);
});
