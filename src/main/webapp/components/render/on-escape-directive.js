(function () {
    'use strict';

    angular
        .module('embryo.components.render')
        .directive("onEscape", onEscape);

    onEscape.$inject = ['$document'];

    function onEscape($document) {
        var directive = {
            link: link
        };
        return directive;
        function link($scope, $element, $attributes) {
            var scopeExpression = $attributes.onEscape;
            onEsc($scope, $document, $element, scopeExpression);
        }
    }
})();