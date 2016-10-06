(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .service('RiskAssessmentDataService', RiskAssessmentDataService);

    RiskAssessmentDataService.$inject = ['$q', 'PouchDBFactory', 'Subject'];

    function RiskAssessmentDataService($q, PouchDBFactory, Subject) {

        this.getAssessmentData = getAssessmentData;
        this.storeAssessmentData = storeAssessmentData;

        var pouch = initializePouch();

        function getAssessmentData(routeId) {
            return pouch.get(routeId)
                .then(function (assessmentData) {
                    return angular.fromJson(assessmentData);
                })
                .catch(function (err) {
                    if (err.status == 404) {
                        return {
                            _id: routeId,
                            routeLocationSequence: 1,
                            routeLocations: [],
                            currentAssessment: null,
                            assessments: []
                        };
                    } else {
                        return $q.reject(err);
                    }
                });
        }

        function storeAssessmentData(routeId, assessmentData) {
            ensureSupportForMapSerialization();

            if (!routeId) {
                return $q.reject("No route id specified!");
            }

            //PouchDB can't handle objects with functions hence the serializing/deserializing
            assessmentData = angular.fromJson(angular.toJson(assessmentData));
            return pouch.get(routeId)
                .then(function (oldDoc) {
                    assessmentData._rev = oldDoc._rev;
                    return pouch.put(assessmentData);
                })
                .catch(function (err) {
                    if (err.status == 404) {
                        return pouch.put(assessmentData);
                    } else {
                        return $q.reject(err);
                    }
                });
        }

        function ensureSupportForMapSerialization() {
            if (!Map.prototype.toJSON) {
                Map.prototype.toJSON = function () {
                    return Array.from(this);
                }
            }
        }

        function initializePouch() {
            var dbName = Subject.getDetails().userName;
            console.log("Pouch DB name: " + dbName);
            var local = PouchDBFactory.createLocalPouch(dbName);
            var remote = PouchDBFactory.createRemotePouch(dbName);

            local.sync(remote, {
                live: true,
                retry: true
            });

            return local;
        }
    }
})();