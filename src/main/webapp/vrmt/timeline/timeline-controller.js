(function () {
    angular
        .module('vrmt.app')
        .controller("TimelineController", TimelineController);

    TimelineController.$inject = [];

    function TimelineController() {
        var vm = this;

        vm.hidden = true;
        vm.choosenTime = 0;
        vm.times = [];
        vm.calculatedIndexes = createTimelineSegments();
        vm.timelineDimensions = createDimensions();
        vm.moveVessel = moveVessel;

        var offset = vm.timelineDimensions.offset;
        var distanceBetween = 20;
        var width = vm.timelineDimensions.width;
        for (var i = 0; (i * distanceBetween + offset) < (width - offset); i++) {
            vm.times[i] = {
                x1: i * distanceBetween + offset
            };
        }

        function moveVessel($event) {
            $event.preventDefault();
            vm.choosenTime = $event.offsetX;
        }

        function createTimelineSegments() {
            return [
                {
                    color: "#FFFF00",
                    x1: 0,
                    x2: 100,
                    y1: 100,
                    y2: 100
                },
                {
                    color: "#FFFF00",
                    x1: 100,
                    x2: 100,
                    y1: 100,
                    y2: 150
                },
                {
                    color: "#00FF00",
                    x1: 100,
                    x2: 200,
                    y1: 150,
                    y2: 150
                },
                {
                    color: "#00FF00",
                    x1: 200,
                    x2: 200,
                    y1: 150,
                    y2: 50
                },
                {
                    color: "#FF0000",
                    x1: 200,
                    x2: 300,
                    y1: 50,
                    y2: 50
                }
            ];

        }

        function indexToPixels(baseline, index, maxIndex) {
            return (baseline / maxIndex) * index;
        }

        function createDimensions() {
            var d = {};
            d.width = 600;
            d.height = 250;
            d.offset = 1;
            d.baseline = d.height - 30;
            d.yellowThreshold = indexToPixels(d.baseline, 1000, 3000);
            d.redThreshold = indexToPixels(d.baseline, 2000, 3000);
            return d;
        }
    }

})();