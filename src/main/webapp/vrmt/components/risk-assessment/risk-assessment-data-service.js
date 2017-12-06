(function () {
    'use strict';

    angular
        .module('vrmt.app')
        .service('RiskAssessmentDataService', RiskAssessmentDataService);

    RiskAssessmentDataService.$inject = ['$q', 'PouchDBFactory', 'Subject', '$timeout'];

    function RiskAssessmentDataService($q, PouchDBFactory, Subject, $timeout) {
        var that = this;
        that.getAssessmentData = unInitialized;
        that.storeAssessmentData = unInitialized;
        that.getRiskFactorData = unInitialized;
        that.storeRiskFactorData = unInitialized;
        var riskFactorId;
        var pouch;

        initialize();

        function initialize() {
            if (Subject.getDetails().shipMmsi) {
                riskFactorId = "mmsi_" + Subject.getDetails().shipMmsi;
                pouch = initializePouch();
                that.getAssessmentData = getAssessmentData;
                that.storeAssessmentData = storeAssessmentData;
                that.getRiskFactorData = getRiskFactorData;
                that.storeRiskFactorData = storeRiskFactorData;
            } else {
                $timeout(function () {
                    initialize();
                }, 10);
            }
        }

        function unInitialized() {
            return $q.reject("The Data service is not yet initialized");
        }

        function getAssessmentData(routeId) {
            return pouch.get(routeId)
                .then(function (assessmentData) {
                    return angular.fromJson(assessmentData);
                })
                .catch(function (err) {
                    if (err.status === 404) {
                        return {
                            _id: routeId,
                            routeLocationSequence: 1,
                            routeLocations: [],
                            /** @type {Assessment|null} */
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
                    if (err.status === 404) {
                        return pouch.put(assessmentData);
                    } else {
                        return $q.reject(err);
                    }
                });
        }

        function getRiskFactorData() {
            return pouch.get(riskFactorId)
                .then(function (doc) {
                    return unWrapriskFactorData(angular.fromJson(doc));
                })
                .catch(function (err) {
                    if (err.status === 404) {
                        return undefined;
                    } else {
                        return $q.reject(err);
                    }
                });
        }

        function storeRiskFactorData(riskFactorData) {
            //PouchDB can't handle objects with functions hence the serializing/deserializing
            riskFactorData = angular.fromJson(angular.toJson(riskFactorData));
            var wrappeddata = wrapRiskFactorData(riskFactorData);

            return pouch.get(riskFactorId)
                .then(function (oldDoc) {
                    wrappeddata._rev = oldDoc._rev;
                    return pouch.put(wrappeddata);
                })
                .catch(function (err) {
                    if (err.status === 404) {
                        return pouch.put(wrappeddata);
                    } else {
                        return $q.reject(err);
                    }
                })
        }

        function wrapRiskFactorData(data) {
            return {
                _id: riskFactorId,
                data: data
            };
        }

        function unWrapriskFactorData(wrappedData) {
            return wrappedData.data;
        }

        function ensureSupportForMapSerialization() {
            if (!Map.prototype.toJSON) {
                Map.prototype.toJSON = function () {
                    return Array.from(this);
                }
            }
        }

        function initializePouch() {
            var dbName = 'vrmt_' + Subject.getDetails().shipMmsi;
            console.log("Pouch DB name: " + dbName);
            var local = PouchDBFactory.createLocalPouch(dbName);
            var remote = PouchDBFactory.createRemotePouch(dbName);

            local.compact().then(function (result) {
                console.log("Compaction done.");
                console.log(result);
            }).catch(function (err) {
                console.log("Compaction failed.");
                console.log(err);
            });

            var syncHandler = local.sync(remote, {
                live: true,
                retry: true,
                timeout: 30000
            });

            syncHandler.on('error', function (err) {
                console.error("Sync failed for document");
                console.error(err)
            }).on('denied', function (err) {
                console.error("Sync failed for document due to validation or authorization errors");
                console.error(err)
            });
            return local;
        }
    }
})();