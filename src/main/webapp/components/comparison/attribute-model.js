(function(){
    var module = angular.module('embryo.attribute.model',[]);

    module.factory('Attribute', function () {
        function Attribute(value) {
            this.value = value;
        }

        Attribute.prototype.valueOf = function () {
            return this.value;
        };
        Attribute.build = function (scope, path) {

            var value = scope;
            angular.forEach(path, function (v) {
                value = value[v];
            });
            return new Attribute(value);
        };
        return Attribute;
    });
})();
