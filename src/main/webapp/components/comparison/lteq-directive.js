(function(){

    var module = angular.module('embryo.lteq.directive',['embryo.attribute.model']);

    module.directive('lteq', ["Attribute", function (Attribute) {
        return {
            require: 'ngModel',
            link: function (scope, element, attr, ngModelController) {
                var path = attr.lteq.split('.');

                function valid(value1, value2) {
                    return value1 <= value2;
                }

                //For DOM -> model validation
                ngModelController.$parsers.unshift(function (value) {
                    var otherValue = Attribute.build(scope, path).valueOf();
                    if (!otherValue && otherValue != 0) {
                        return value;
                    }
                    ngModelController.$setValidity('lteq', valid(value, otherValue));
                    return value;
                });

                //For model -> DOM validation
                ngModelController.$formatters.unshift(function (value) {
                    var otherValue = Attribute.build(scope, path).valueOf();
                    if (!otherValue && otherValue != 0) {
                        return value;
                    }
                    ngModelController.$setValidity('lteq', valid(value, otherValue));
                    return value;
                });
            }
        };
    }]);
})()

