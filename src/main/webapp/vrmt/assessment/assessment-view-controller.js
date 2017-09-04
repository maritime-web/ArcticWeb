(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .controller("AssessmentViewController", AssessmentViewController);

    AssessmentViewController.$inject = ['$scope', 'NotifyService', 'VrmtEvents', 'growl'];

    function AssessmentViewController($scope, NotifyService, VrmtEvents, growl) {
        var vm = this;
        vm.hide = true;
        vm.dismiss = dismiss;
        vm.finished = "";
        vm.locationAssessments = [];

        function dismiss() {
            vm.hide = true;
        }

        function LocationAssessmentview(locationAssessment) {
            Object.assign(this, locationAssessment);
            this.active = false;
            this.time = moment(locationAssessment.time).format("YYYY-MM-DD HH:mm");
        }

        NotifyService.subscribe($scope, VrmtEvents.OpenAssessmentView, onOpen);

        function onOpen(event, assessment) {
            vm.hide = false;
            vm.finished = assessment.finished.format("YYYY-MM-DD HH:mm");
            vm.locationAssessments = assessment.getLocationAssessments().map(function (locationAssessment) {
                return new LocationAssessmentview(locationAssessment);
            });
        }
    }
})();