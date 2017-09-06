function onEsc($scope, document, element, action) {
    var onEsc = function (event) {
        var isEsc = event.which === 27;

        if (isEsc) {
            $scope.$apply(action);
        }
    };

    document.on("keydown", onEsc);
    element.on('$destroy', function () {
        document.off("keydown", onEsc);
    });
}

function onOutsideClick($scope, document, element, action) {
    var onDocumentClick = function (event) {
        var isSelfOrChild = element.find(event.target).length > 0 || element.html() == angular.element(event.target).html();

        if (!isSelfOrChild) {
            $scope.$apply(action);
        }
    };

    document.on("click", onDocumentClick);

    var offHandle = function () {
        document.off("click", onDocumentClick);
    };
    element.on('$destroy', offHandle);

    return offHandle;
}
