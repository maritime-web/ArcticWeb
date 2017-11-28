var module = angular.module('embryo.feedback', ['embryo.base']);

module.controller('embryo.FeedbackCtrl', ['$scope', '$http', function($scope, $http) {
    $scope.sendFeedback = function($event) {
        $event.preventDefault();
        $http.post(embryo.baseUrl + 'rest/feedback', $scope.feedback).then(function() {
            $scope.message = "Thank you for your feedback! You will receive an answer as soon as possible.";
        }).catch(function(response) {
            $scope.alertMessages = ['Something went wrong when sending feedback. The error was: ' + response.data];
        });
    };
    
    $scope.userTypes = ['Ship', 'Shore', 'Maritime Pilot', 'Coastal Control', 'Authority', 'Other'];
    $scope.feedback = {
    		userType: 'Ship'
    };
}]);