describe('embryo.geo.Position', function () {
    beforeEach(function () {
        // TODO remove embryo.geo.services module import and test with stub/mock instead
        module('embryo.geo.services');
    });

    /*
     * Verification of result from Java Position test in enav-model
     */
    describe('rhumblineBearingTo', function () {
        it('simple rhumbline bearing', inject(function (Position) {
            var p1 = Position.create({
                lon : -48.916016666666664,
                lat : 58.138933333333334
            });
            var p2 = Position.create({
                lon : -55.24413333333333,
                lat : 58.58278333333333
            });

            var result = p1.rhumbLineBearingTo(p2);
            expect(result).toBeDefined();

            // Expectation according to http://www.movable-type.co.uk/scripts/latlong.html
            expect(result).toBeCloseTo(277.6159, 4);

            // Expectation according to http://www.sunearthtools.com/tools/distance.php
            expect(result).toBeCloseTo(277.62, 2);

            // Expectation from calculated result.
            // Used only to see if result changes over time
            expect(result).toBeCloseTo(277.61590166083806, 13);
        }))
    })

    describe('transformRhumbLine', function () {
        it('Simple calculation with 201.07670188349698 nm and bearing 277.61590166083806', inject(function (Position) {
            var p1 = Position.create({
                lon: -48.916016666666664,
                lat: 58.138933333333334
            });
            var p2 = Position.create({
                lon: -55.24413333333333,
                lat: 58.58278333333333
            });


            var inKm= 201.07670188349698 * 1.852;

            var position = p1.transformRhumbLine(277.61590166083806, 201.07670188349698);
            expect(position).toBeDefined();
            expect(position.lat).toBeDefined();
            expect(position.lon).toBeDefined();

            // Expectation according to http://www.movable-type.co.uk/scripts/latlong.html
            expect(position.lat).toBeCloseTo(58.5828, 4);
            expect(position.lon).toBeCloseTo(-55.2441, 4);

        }));
    })

});