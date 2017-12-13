(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .directive('sourceLabel', sourceLabel);

    function sourceLabel() {
        var directive = {
            restrict: 'E',
            template: "<span class='source-label {{hidden}}'> {{paddedSource}}</span>",
            scope: {
                source: '='
            },
            link: link
        };
        return directive;

        function link(scope) {
            scope.hidden = "";
            update(scope.source);

            function update(src) {
                if (src) {
                    scope.paddedSource = src;
                    scope.hidden = "";
                } else {
                    scope.paddedSource = "";
                    scope.hidden = "hidden";

                }
            }

            scope.$watch('source', function (newsource) {
                update(newsource);
            });
        }
    }

})();