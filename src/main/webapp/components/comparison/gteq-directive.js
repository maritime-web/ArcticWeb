$(function(){

    var module = angular.module('embryo.gteq.directive', ['embryo.attribute.model']);
    module.directive('gteq', ['Attribute', function (Attribute) {
        return {
            require: '^ngModel',
            link: function (scope, element, attr, ngModelController) {
                var path = attr.gteq.split('.');

                function valid(value1, value2) {
                    return value1 > value2;
                }

                //For DOM -> model validation
                ngModelController.$parsers.unshift(function (value) {
                    var otherValue = Attribute.build(scope, path).valueOf();
                    ngModelController.$setValidity('gteq', valid(value, otherValue));
                    return value;
                });

                //For model -> DOM validation
                ngModelController.$formatters.unshift(function (value) {
                    var otherValue = Attribute.build(scope, path).valueOf();
                    ngModelController.$setValidity('gteq', valid(value, otherValue));
                    return value;
                });
            }
        };
    }]);
});
