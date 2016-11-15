(function() {
    embryo.vessel.actions = {
        selectedVessel : function() {
            return [ "PolarWeb Reporting", embryo.additionalInformation.route, "Additional Information",
                    embryo.additionalInformation.nearestShips,
                    embryo.additionalInformation.distanceCircles ];
        }
    };
})();
