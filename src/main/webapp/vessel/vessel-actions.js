(function() {
    if (!embryo.vessel) {
        embryo.vessel = {};
    }
    embryo.vessel.actions = {
        selectedVessel : function() {
            return [ "Arctic Reporting", embryo.additionalInformation.route, "Additional Information",
                    embryo.additionalInformation.nearestShips,
                    embryo.additionalInformation.distanceCircles ];
        }
    };
})();
