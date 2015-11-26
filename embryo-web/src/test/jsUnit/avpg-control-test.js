"use strict";

describe("embryo.avpg.control", function() {
    var $controller;
    beforeEach(module('embryo.avpg.control'));

    beforeEach(inject(function(_$controller_){
        $controller = _$controller_;
    }));

    describe("AVPGTextViewCtrl", function() {
        var $scope, controller, $log, AVPGContentService, ViewService;

        beforeEach(inject(function(_$log_) {
            $log = _$log_;
        }));

        beforeEach(function() {
            $scope = {};
            AVPGContentService = {getContentById: function(){return "";}};
            ViewService = {addViewProvider: function(){}};
            controller = $controller('AVPGTextViewCtrl', { $scope: $scope});
        });

        afterEach(function() {
            console.log($log.debug.logs);
        });

        it("should initialize provider.doShow to false", function() {
            expect($scope.provider.doShow).toBe(false);
        });

        it("should have AVPG as provider.type", function() {
            expect($scope.provider.type).toEqual("AVPG");
        });

        it("should be initialized with default content from AVPGContentService", function() {
            var expectedDefaultContent = "default content";
            AVPGContentService.getContentById = function() {return expectedDefaultContent};
            spyOn(AVPGContentService, 'getContentById').and.callThrough();

            controller = $controller('AVPGTextViewCtrl', { $scope: $scope, AVPGContentService: AVPGContentService});

            expect($scope.provider.content).toEqual(expectedDefaultContent);
            expect(AVPGContentService.getContentById).toHaveBeenCalledWith("default");
        });

        it("should set doShow to true when calling show", function() {
            $scope.provider.show();

            expect($scope.provider.doShow).toBe(true);
        });

        it("should load content when calling show with a content id", function() {
            var contentId = "exiting content";
            var content = "tada";
            AVPGContentService.getContentById = function(cid) {return cid == contentId ? content : "default"};
            spyOn(AVPGContentService, 'getContentById').and.callThrough();

            controller = $controller('AVPGTextViewCtrl', { $scope: $scope, AVPGContentService: AVPGContentService});

            $scope.provider.show(contentId);

            expect($scope.provider.content).toEqual(content);
            expect(AVPGContentService.getContentById).toHaveBeenCalledWith(contentId);
        });

        it("should set doShow to false when calling close", function() {
            $scope.provider.doShow = true;

            $scope.provider.close();

            expect($scope.provider.doShow).toBe(false);
        });

        it("should register the provider with the ViewService", function() {
            spyOn(ViewService, "addViewProvider");

            controller = $controller('AVPGTextViewCtrl', { $scope: $scope, ViewService: ViewService});

            expect(ViewService.addViewProvider).toHaveBeenCalledWith($scope.provider);
        });

        it("should call $event.preventDefault() on close", function() {
            var $event = {preventDefault: function(){}};
            spyOn($event, "preventDefault");

            $scope.close($event);

            expect($event.preventDefault).toHaveBeenCalled();
        });

        it("should call provider.close() on close", function() {
            $scope.provider.doShow = true;

            $scope.close({preventDefault: function(){}});

            expect($scope.provider.doShow).toBe(false);
        });
    });
});
