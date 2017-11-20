describe('embryo.sar.TimeElapsed', function () {
    beforeEach(function () {
        module('embryo.sar.TimeElapsed');
    });

    function execWithTryCatch(fn) {
        try {
            fn();
        } catch (Error) {
            return Error;
        }
        return null;
    }

    function assertErrorContent(err, fieldName) {
        expect(err).toBeDefined();
        expect(err.message).toBeDefined();
        expect(err.message.indexOf(fieldName) >= 0).toBe(true);
    }

    describe('TimeElapsed', function () {
        it('TimeElapsed.build with times one hour apart', inject(function (TimeElapsed) {
            var now = Date.now();
            var timeElapsed = TimeElapsed.build(now - 60 * 60 * 1000, now);

            expect(timeElapsed).toBeDefined();
            expect(timeElapsed.timeElapsed).toBe(1);
            expect(timeElapsed.hoursElapsed).toBe(1);
            expect(timeElapsed.minutesElapsed).toBe(0);
        }))

        it('TimeElapsed.build with times one hour 30 minutes apart', inject(function (TimeElapsed) {
            var now = Date.now();
            var timeElapsed = TimeElapsed.build(now - 60 * 60 * 1000 * 1.5, now);

            expect(timeElapsed).toBeDefined();
            expect(timeElapsed.timeElapsed).toBe(1.5);
            expect(timeElapsed.hoursElapsed).toBe(1);
            expect(timeElapsed.minutesElapsed).toBe(30);
        }));
        it('TimeElapsed.build with from ts but undefined commence search start', inject(function (TimeElapsed) {
            var now = Date.now();

            var error = execWithTryCatch(function(){
                TimeElapsed.build(now - 60 * 60 * 1000 * 1.5, undefined);
            })
            assertErrorContent(error, "commenceSearchStart")
        }));
        it('TimeElapsed.build with undefined first ts, but valid commence search start', inject(function (TimeElapsed) {
            var now = Date.now();
            var error = execWithTryCatch(function(){
                TimeElapsed.build(undefined, now);
            })
            assertErrorContent(error, "startPositionTs")
        }));
    });
});