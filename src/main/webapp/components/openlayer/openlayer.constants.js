(function () {
    'use strict';

    angular.module('embryo.components.openlayer').constant('OpenlayerEvents', {
        PanToFeature: 'Openlayer.PanToFeature',
        ZoomToFeature: 'Openlayer.ZoomToFeature',
        ZoomToLayer: 'Openlayer.ZoomToLayer',
        ZoomAndCenter: 'Openlayer.ZoomAndCenter',
        ZoomToExtent: 'Openlayer.ZoomToExtent',
        BoxChanged: 'Openlayer.BoxChanged',
        SaveMapState: 'Openlayer.SaveMapState'
    });

})();