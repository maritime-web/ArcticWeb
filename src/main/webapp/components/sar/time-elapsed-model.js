(function () {
    "use strict";

    var module = angular.module('embryo.sar.TimeElapsed', []);

    module.factory('TimeElapsed', function () {
        function TimeElapsed(data) {
            angular.extend(this, data);
        }
        TimeElapsed.validate = function (startPositionTs, commenceSearchStart) {
            assertValue(startPositionTs, "startPositionTs");
            assertValue(commenceSearchStart, "commenceSearchStart");
        }
        TimeElapsed.build = function(startPositionTs, commenceSearchStart){
            TimeElapsed.validate(startPositionTs, commenceSearchStart);
            var difference = (commenceSearchStart - startPositionTs) / 60 / 60 / 1000;
            var data = {};
            data.timeElapsed = difference;
            data.hoursElapsed = Math.floor(difference);
            data.minutesElapsed = Math.round((difference - data.hoursElapsed) * 60);
            return new TimeElapsed(data);
        }
        return TimeElapsed;
    });
})();
