(function () {
    'use strict';

    angular
        .module('embryo.components.render')
        .directive("outsideClick", outsideClick);

    outsideClick.$inject = ['$document'];

    function outsideClick($document) {
        var directive = {
            link: link
        };
        return directive;

        function link($scope, $element, $attributes) {
            var scopeExpression = $attributes.outsideClick;
            onOutsideClick($scope, $document, $element, scopeExpression);
        }
    }
})();