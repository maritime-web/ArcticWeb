describe('embryo.sar.SearchCircle', function () {
    beforeEach(function () {
        // TODO remove embryo.geo.services module import and test with stub/mock instead
        module('embryo.geo.services');
        module('embryo.sar.SearchCircle');
    });

    describe('SearchCircle', function () {
        it('SearchCircle.build', inject(function (SearchCircle, Position) {
            var datum = Position.create({
                lon : "015 12.124W",
                lat : "12 12.123N"
            });
            var circle = SearchCircle.build(1, 0.1, 1, 10, datum);

            expect(circle.datum).toBeDefined();
            expect(circle.datum.lon).toBe("015 12.124W");
            expect(circle.datum.lat).toBe("12 12.123N");
            expect(circle.radius).toBe(4.1);
        }))
    })
});