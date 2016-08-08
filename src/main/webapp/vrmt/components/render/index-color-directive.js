(function () {
    'use strict';

    angular
        .module('vrmt.render')
        .directive('indexColor', indexColor);

    function indexColor() {
        var directive = {
            restrict: 'E',
            template: "<span style='background-color: {{color}};color: transparent;font-family: Courier New'>{{zeroPad}}</span><span style='background-color: {{color}}; color: {{textColor}}; padding-right: 1px;padding-left: 1px;font-family: Courier New'>{{index}}</span>",
            scope: {
                index: '='
            },
            link: link
        };
        return directive;

        function link(scope) {
            scope.color = null;
            scope.textColor = "white";
            scope.zeroPad = "";
            function setColorForIndex(index) {
                scope.textColor = "white";
                if (index === '-') {
                    scope.color = "transparent";
                    scope.textColor = "black";
                } else if (index < 1000) {
                    scope.color = "green";
                } else if (index > 2000) {
                    scope.color = "red";
                } else {
                    scope.color = "yellow";
                    scope.textColor = "black";
                }
            }

            function adjustZeroPad(newIndex) {
                if (angular.isNumber(newIndex)) {
                    var length = newIndex.toString().length;
                    scope.zeroPad = "0".repeat(4 - length);
                } else {
                    scope.zeroPad = "0";
                }
            }

            scope.$watch('index', function (newIndex) {
                setColorForIndex(newIndex);
                adjustZeroPad(newIndex);
            });
        }
    }

})();