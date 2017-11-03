(function () {

    angular.module('embryo.core')
        .controller("CoreController", CoreController);

    CoreController.$inject = ['$scope', 'NotifyService', 'Subject', 'OpenlayerEvents', 'OpenlayerService', 'CookieService'];

    function CoreController($scope, NotifyService, Subject, OpenlayerEvents, OpenlayerService, CookieService) {
        var userName = Subject.getDetails().userName;
        loadViewCookie();

        /**
         * Get settings from cookies
         */
        function loadViewCookie() {
            var resolution = CookieService.get("dma-ais-resolution-" + userName);
            var center = CookieService.get("dma-ais-center-" + userName);
            if (resolution && center) {
                NotifyService.notify(OpenlayerEvents.ZoomAndCenter, {resolution: resolution, center: center});
            } else {
                NotifyService.notify(OpenlayerEvents.ZoomAndCenter, {
                    center: OpenlayerService.getArcticCenter(),
                    resolution: OpenlayerService.maxResolution
                });
            }
        }

        NotifyService.notify(OpenlayerEvents.SaveMapState, {
            centerCookie: "dma-ais-center-" + userName,
            resolutionCookie: "dma-ais-resolution-" + userName
        });
    }
})();
