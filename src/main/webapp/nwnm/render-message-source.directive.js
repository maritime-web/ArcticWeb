/****************************************************************
 * Renders the message source + publication date (adapted from niord)
 ****************************************************************/
(function () {
    angular.module('embryo.nwnm')
        .directive('renderMessageSource', [
            function () {
                return {
                    restrict: 'E',
                    template: '<span class="message-source">{{source}}</span>',
                    scope: {
                        msg: "="
                    },
                    link: function (scope) {

                        scope.source = '';

                        scope.updateSource = function () {
                            scope.source = '';

                            if (scope.msg) {
                                var desc = scope.msg.descs[0];
                                if (desc && desc.source) {
                                    scope.source = desc.source;
                                }
                                if (scope.msg.publishDateFrom &&
                                    (scope.msg.status === 'PUBLISHED' || scope.msg.status === 'EXPIRED' || scope.msg.status === 'CANCELLED')) {
                                    if (scope.source.length > 0) {
                                        if (scope.source.charAt(scope.source.length - 1) !== '.') {
                                            scope.source += ".";
                                        }
                                        scope.source += " ";
                                    }

                                    scope.source += "Published"
                                        + " " + moment(scope.msg.publishDateFrom).format("D MMMM YYYY");
                                }
                            }
                        };

                        scope.$watch("[msg.descs, msg.publishDateFrom]", scope.updateSource, true);
                    }
                };
            }]);
})();