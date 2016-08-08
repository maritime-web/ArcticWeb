(function () {
    'use strict';

    angular
        .module('vrmt.render')
        .directive("mwSelectRenderer", mwSelectRenderer);

    mwSelectRenderer.$inject = ['$document'];

    function mwSelectRenderer($document) {
        var directive = {
            link: link
        };

        return directive;

        function link($scope, $element, $attributes) {
            var selectButton = $element.children()[0];
            var optionContainer = angular.element($element.children()[1]);
            optionContainer.addClass("hidden");

            positionOptionContainer(selectButton, optionContainer);
            toggleOptionsOnClick(selectButton, optionContainer);
            onEsc($scope, $document, optionContainer, function () {
                optionContainer.addClass("hidden");
            });

            function positionOptionContainer(selectButton, optionContainer) {
                optionContainer.css({
                    position: 'absolute',
                    left: selectButton.offsetLeft,
                    top: selectButton.offsetTop + selectButton.offsetHeight
                });
            }

            function toggleOptionsOnClick(selectButton, optionContainer) {
                var toggle = function () {
                    optionContainer.toggleClass("hidden");
                };
                var sb = angular.element(selectButton);
                onOutsideClick($scope, $document, sb, function () {
                    optionContainer.addClass("hidden");
                });
                sb.on("click", toggle);
                $element.on('$destroy', function () {
                    sb.off("click", toggle)
                });
            }
        }
    }
})();