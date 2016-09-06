(function () {

//    var msiLayer = new MsiLayer();
//    addLayerToMap("msi", msiLayer, embryo.map);

    var module = angular.module('embryo.sar.views', ['embryo.lteq.directive', 'embryo.gteq.directive', 'embryo.sar.model', 'embryo.sar.service', 'embryo.common.service', 'ui.bootstrap.typeahead', 'embryo.datepicker', 'embryo.position', 'embryo.sar.userPouch']);

    function SarTypeData(group, text, img) {
        this.group = group;
        this.text = text;
        this.img = img;
    }

    //var sarTypes = embryo.sar.Operation;
    var sarTypeDatas = {}
    sarTypeDatas[embryo.sar.Operation.RapidResponse] = new SarTypeData("Drift", "Rapid response", "/img/sar/generic.png");
    sarTypeDatas[embryo.sar.Operation.DatumPoint] = new SarTypeData("Drift","Datum point", "/img/sar/datumpoint.png");
    sarTypeDatas[embryo.sar.Operation.DatumLine] = new SarTypeData("Drift", "Datum line", "/img/sar/datumline.png");
    sarTypeDatas[embryo.sar.Operation.BackTrack] = new SarTypeData("Drift","Back track", "/img/sar/backtrack.png")
    sarTypeDatas[embryo.sar.Operation.TrackLine] = new SarTypeData("Search","Track line search", "/img/sar/tracklinesss.png")

    module.controller("SAROperationEditController", ['$scope', 'ViewService', 'SarService', '$q', 'LivePouch', 'UserPouch', 'SarOperationFactory', '$timeout', '$log', 'Position',
        function ($scope, ViewService, SarService, $q, LivePouch, UserPouch, SarOperationFactory, $timeout, $log, Position) {

            $scope.alertMessages = [];

            function initSarTypeSelection() {
                $scope.sar = {
                    type: embryo.sar.Operation.RapidResponse,
                    no: SarOperationFactory.createSarId(),
                }

                if($scope.backTrackInitializer){
                    $scope.sarTypeValues = [embryo.sar.Operation.RapidResponse, embryo.sar.Operation.DatumPoint, embryo.sar.Operation.DatumLine];
                }else{
                    $scope.sarTypeValues = [embryo.sar.Operation.RapidResponse, embryo.sar.Operation.DatumPoint, embryo.sar.Operation.DatumLine, embryo.sar.Operation.BackTrack, embryo.sar.Operation.TrackLine];
                }

                $scope.sarOperation = {}
            }

            function initNewSar() {
                var now = Date.now();

                $scope.sar.searchObject= $scope.searchObjects[0].id;
                $scope.sar.yError = 0.1;
                $scope.sar.safetyFactor = 1.0;

                $scope.sarOperation = {}


                if ($scope.sar.type != embryo.sar.Operation.DatumLine && $scope.sar.type != embryo.sar.Operation.BackTrack && $scope.sar.type != embryo.sar.Operation.TrackLine) {
                    if (!$scope.sar.lastKnownPosition) {
                        $scope.sar.lastKnownPosition = {};
                    }
                    if (!$scope.sar.lastKnownPosition.ts) {
                        $scope.sar.lastKnownPosition.ts = now;
                    }
                }
                if ($scope.sar.type != embryo.sar.Operation.BackTrack) {
                    $scope.sar.startTs = ($scope.sar.lastKnownPosition && $scope.sar.lastKnownPosition.ts ? $scope.sar.lastKnownPosition.ts : now) + 1000 * 60 * 60;
                }
                if (!$scope.sar.surfaceDriftPoints) {
                    $scope.sar.surfaceDriftPoints = [{}];
                }
                if (!$scope.sar.surfaceDriftPoints[0].ts) {
                    $scope.sar.surfaceDriftPoints[0].ts = $scope.sar.lastKnownPosition && $scope.sar.lastKnownPosition.ts ? $scope.sar.lastKnownPosition.ts : now;
                }

                if ($scope.sar.type == embryo.sar.Operation.BackTrack) {
                    $scope.sar.yError = 0;
                    $scope.sar.driftFromTs = now - 1000 * 60 * 60;
                    if (!$scope.sar.objectPosition) {
                        $scope.sar.objectPosition = {};
                    }
                    if (!$scope.sar.objectPosition.ts) {
                        $scope.sar.objectPosition.ts = now;
                    }
                    $scope.sar.surfaceDriftPoints[0].ts = $scope.sar.driftFromTs;
                }
            }

        $scope.provider = {
            doShow: false,
            title: "Create SAR",
            type: "newSar",
            show: function (context) {
                $scope.alertMessages = [];
                $scope.page = {
                    name : context && context.page ? context.page : 'typeSelection'
                }
                if(context.page == "sarResult" || context.page == "backtrackResult"){
                    $scope.tmp = {
                        viewOnly : true
                    }
                }
                $scope.backTrackInitializer = null;
                $scope.sarTypeValues = [embryo.sar.Operation.RapidResponse, embryo.sar.Operation.DatumPoint, embryo.sar.Operation.DatumLine, embryo.sar.Operation.BackTrack, embryo.sar.Operation.TrackLine];
                if (context.sarId) {
                    LivePouch.get(context.sarId).then(function (sarOperation) {
                        $scope.sarOperation = sarOperation;
                        $scope.sar = sarOperation.input;
                    })
                } else {
                    initSarTypeSelection();
                }

                this.doShow = true;
            },
            close: function () {
                this.doShow = false;
            }
        };
        ViewService.addViewProvider($scope.provider);

        $scope.close = function ($event) {
            $event.preventDefault();
            $scope.provider.close();
        };

        $scope.searchObjects = SarService.searchObjectTypes();
        $scope.sarTypes = embryo.sar.Operation;
        $scope.sarTypeDatas = sarTypeDatas;
        $scope.tmp = {
                sarTypeData: $scope.sarTypeDatas[0]
        }

        $scope.getDirections = function (query) {
            return function () {
                var deferred = $q.defer();
                var result = SarService.queryDirections(query);
                deferred.resolve(result);
                return deferred.promise;
            }().then(function (res) {
                return res;
            });

        }

        $scope.formatTs = formatTime;
        $scope.formatDecimal = embryo.Math.round10;
        $scope.formatPos = function (position) {
            if (!position || (!position.lat && !position.lon)) {
                return ""
            }
            var pos = Position.create(position).toDegreesAndDecimalMinutes();

            return pos.lat + ", " + pos.lon;
        };

        $scope.back = function () {
            switch ($scope.page.name) {
                case ("sarResult") :
                {
                    $scope.alertMessages = []
                    $scope.page.name = 'sarInputs';
                    break;
                }
                case ("sarInputs") :
                {
                    $scope.alertMessages = []
                    $scope.page.name = 'typeSelection';
                    break;
                }
            }
        }

        $scope.next = function () {
            if($scope.sar.type === embryo.sar.Operation.BackTrack){
                $scope.page.name = 'drift';
            } else if ($scope.sar.type === embryo.sar.Operation.TrackLine){
                $scope.page.name = 'route';
                $scope.createTrackline();
            } else{
                $scope.page.name = 'sarInputs';
            }
            if($scope.backTrackInitializer){
                $scope.backTrackInitializer()
            }
            if(!$scope.sar.searchObject && $scope.sar.searchObject != 0){
                initNewSar()
            }
        }

        $scope.addDSP = function() {
            var now = Date.now();
            if(!$scope.sar.dsps || $scope.sar.dsps.length == 0){
                $scope.dsp = {
                    ts : now - 2 * 1000 * 60 * 60
                }
            } else if ($scope.sar.dsps.length == 1){
                $scope.dsp = {
                    ts : now - 1000 * 60 * 60,
                    reuseSurfaceDrifts : true
                }
            } else {
                $scope.dsp = {
                    ts : now,
                    reuseSurfaceDrifts : true
                }
            }
            delete $scope.dspToEditIndex;
            $scope.page.name = "DSP";
        }
        $scope.removeDSP = function(dsps, $index){
            dsps.splice($index, 1);
        }
        $scope.editDSP = function($index){
            $scope.dspToEditIndex = $index;
            $scope.page.name = "DSP";
        }

        $scope.createBackTrack = function () {
            var sarInput = $scope.sar;

            UserPouch.allDocs({
                include_docs: true
            }).then(function (result) {
                var users = SarService.extractDbDocs(result);

                try {
                    $scope.alertMessages = [];
                    // retain PouchDB fields like _id and _rev
                    var calculatedOperation = SarOperationFactory.createSarOperation(sarInput);
                    $scope.sarOperation['@type'] = calculatedOperation['@type'];
                    $scope.sarOperation.coordinator = SarService.findAndPrepareCurrentUserAsCoordinator(users);
                    $scope.sarOperation.input = calculatedOperation.input;
                    $scope.sarOperation.output = calculatedOperation.output;

                    if (!$scope.sarOperation._id) {
                        $scope.sarOperation._id = "sar-" + Date.now();
                        $scope.sarOperation.status = embryo.SARStatus.DRAFT;
                    }

                    return LivePouch.put($scope.sarOperation)
                } catch (error) {
                    $log.error(error)
                    if (typeof error === 'object' && error.message) {
                        $scope.alertMessages.push("Internal error: " + error.message);
                    } else if (typeof error === 'string') {
                        $scope.alertMessages.push("Internal error: " + error);
                    }
                }
            }).then(function (putResponse) {

                if(!$scope.sar.planedRoute){
                    $scope.sar.planedRoute = {}
                }
                if(!$scope.sar.planedRoute.points){
                    $scope.sar.planedRoute.points = [{}];
                }

                return LivePouch.get(putResponse.id)
            }).then(function(sarOperation){
                // SarOperation with updated _rev number
                $scope.page.name = 'route';
                $scope.page.back = 'drift';
                $scope.page.next = 'lkp';
                $scope.sarOperation = sarOperation;
            });
        }

        $scope.createTrackline = function () {
            var sarInput = $scope.sar;

            UserPouch.allDocs({
                include_docs: true
            }).then(function (result) {
                var users = SarService.extractDbDocs(result);

                try {
                    $scope.alertMessages = [];
                    // retain PouchDB fields like _id and _rev

                    if(!$scope.sarOperation._id){
                        $scope.sarOperation = {
                            _id : "sar-" + Date.now(),
                            status : embryo.SARStatus.DRAFT,
                            '@type' : embryo.sar.Type.SearchArea,
                            output : {}
                        }
                        $scope.sarOperation.coordinator = SarService.findAndPrepareCurrentUserAsCoordinator(users);
                    }
                    $scope.sarOperation.input =  clone(sarInput);

                    return LivePouch.put($scope.sarOperation)
                } catch (error) {
                    $log.error(error)
                    if (typeof error === 'object' && error.message) {
                        $scope.alertMessages.push("Internal error: " + error.message);
                    } else if (typeof error === 'string') {
                        $scope.alertMessages.push("Internal error: " + error);
                    }
                }
            }).then(function (putResponse) {
                if(!$scope.sar.planedRoute){
                    $scope.sar.planedRoute = {}
                }
                if(!$scope.sar.planedRoute.points){
                    $scope.sar.planedRoute.points = [{}];
                }
                return LivePouch.get(putResponse.id)
            }).then(function(sarOperation){
                // SarOperation with updated _rev number
                $scope.page.name = 'route';
                $scope.page.back = 'typeSelection';
                $scope.page.next = 'tracklineResult';
                $scope.sarOperation = sarOperation;
            });
        }

        $scope.saveSarOperation = function (pageName) {
            try {
                $scope.alertMessages = [];
                // retain PouchDB fields like _id and _rev
                $scope.sarOperation.input = $scope.sar;

                LivePouch.put($scope.sarOperation).then(function (putResponse) {
                    return LivePouch.get(putResponse.id)
                }).then(function(sarOperation){
                    // SarOperation with updated _rev number
                    $scope.page.name = pageName;
                    $scope.sarOperation = sarOperation;
                }).catch(function(error){
                    $log.error("Error saving sar operation - " + pageName)
                    $log.error(error)
                    $log.error(typeof error)
                    if (typeof error === 'object' && error.message) {
                        $scope.alertMessages.push("Internal error: " + error.message);
                    } else if (typeof error === 'string') {
                        $scope.alertMessages.push("Internal error: " + error);
                    }
                });

            } catch (error) {
                $log.error(error)
                if (typeof error === 'object' && error.message) {
                    $scope.alertMessages.push("Internal error: " + error.message);
                } else if (typeof error === 'string') {
                    $scope.alertMessages.push("Internal error: " + error);
                }
            }
        }

        $scope.createSarOperation = function () {

            var sarInput = $scope.sar;

            UserPouch.allDocs({
                include_docs: true
            }).then(function (result) {
                var users = SarService.extractDbDocs(result);

                try {
                    $scope.alertMessages = [];
                    // retain PouchDB fields like _id and _rev
                    var calculatedOperation = SarOperationFactory.createSarOperation(sarInput);
                    $scope.sarOperation['@type'] = calculatedOperation['@type'];
                    $scope.sarOperation.coordinator = SarService.findAndPrepareCurrentUserAsCoordinator(users);
                    $scope.sarOperation.input = calculatedOperation.input;
                    $scope.sarOperation.output = calculatedOperation.output;

                    $scope.tmp.searchObject = SarService.findSearchObjectType($scope.sarOperation.input.searchObject);
                    $scope.page.name = 'sarResult';
                    if (!$scope.$$phase) {
                        $scope.$apply(function () {
                        });
                    }
                } catch (error) {
                    if (typeof error === 'object' && error.message) {
                        $scope.alertMessages.push("Internal error: " + error.message);
                    } else if (typeof error === 'string') {
                        $scope.alertMessages.push("Internal error: " + error);
                    }
                    if (!$scope.$$phase) {
                        $scope.$apply(function () {
                        });
                    }
                }
            });


        }


            $scope.startNewSar = function () {
                try {
                    $scope.alertMessages = [];
                    // retain PouchDB fields like _id and _rev
                    $scope.sarOperation.input = $scope.sar;

                    var sarOperation = clone($scope.sarOperation)
                    sarOperation.status = embryo.SARStatus.STARTED;

                    LivePouch.put(sarOperation).then(function (putResponse) {
                        return LivePouch.get(putResponse.id)
                    }).then(function(sarOperation){
                        // SarOperation with updated _rev number
                        var selectedPositions = clone(sarOperation).input.selectedPositions;
                        $scope.backTrackInitializer = function(){
                            if(selectedPositions && selectedPositions.length > 0) {
                                if ($scope.sar.type === embryo.sar.Operation.RapidResponse || $scope.sar.type === embryo.sar.Operation.DatumPoint){
                                    if(!$scope.sar.lastKnownPosition){
                                        $scope.sar.lastKnownPosition = Position.create(selectedPositions[0]).toDegreesAndDecimalMinutes();
                                        $scope.sar.lastKnownPosition.ts = selectedPositions[0].ts
                                    }
                                } else if ($scope.sar.type === embryo.sar.Operation.DatumLine){
                                    $scope.sar.dsps = [];
                                    for(var i in selectedPositions){
                                        var dsp = Position.create(selectedPositions[i]).toDegreesAndDecimalMinutes();
                                        dsp.ts = selectedPositions[0].ts
                                        $scope.sar.dsps.push(dsp)
                                    }
                                }
                            }
                        }

                        initSarTypeSelection();
                        $scope.tmp.viewOnly = false;
                        $scope.page.name = "typeSelection";
                    }).catch(function(error){
                        $log.error("Error saving sar operation - " + startNewSar)
                        $log.error(error)
                        $log.error(typeof error)
                        if (typeof error === 'object' && error.message) {
                            $scope.alertMessages.push("Internal error: " + error.message);
                        } else if (typeof error === 'string') {
                            $scope.alertMessages.push("Internal error: " + error);
                        }
                    });

                } catch (error) {
                    $log.error(error)
                    if (typeof error === 'object' && error.message) {
                        $scope.alertMessages.push("Internal error: " + error.message);
                    } else if (typeof error === 'string') {
                        $scope.alertMessages.push("Internal error: " + error);
                    }
                }
            }


        $scope.addPoint = function () {
            $scope.sar.surfaceDriftPoints.push({});
        }

        $scope.removePoint = function () {
            if ($scope.sar.surfaceDriftPoints.length > 1) {
                $scope.sar.surfaceDriftPoints.splice($scope.sar.surfaceDriftPoints.length - 1, 1);
            }
        }

        $scope.finish = function () {
            if (!$scope.sarOperation._id) {
                $scope.sarOperation._id = "sar-" + Date.now();
                $scope.sarOperation.status = embryo.SARStatus.STARTED;
            }

            LivePouch.put($scope.sarOperation).then(function () {
                // hack to increase change SAR is drawn before selecting it
                // this is necessary for zoom to work
                // TODO remove this, when SAR is drawn in draft mode. It is no longer necessary to select SAR in this scenario.
                $timeout(function(){
                    SarService.selectSar($scope.sarOperation._id);
                })
                $timeout(function(){
                    SarService.selectSar($scope.sarOperation._id);
                }, 1000)
                $scope.provider.doShow = false;
            });
        }

        $scope.end = function () {
            var id = $scope.sarOperation._id;

            LivePouch.get(id).then(function (sar) {
                sar.status = embryo.SARStatus.ENDED;
                LivePouch.put(sar).then(function () {
                    $scope.provider.doShow = false;
                    SarService.selectSar(null);
                }).catch(function (err) {
                    console.log(err)
                });
            });
        }

        $scope.getUsers = function (query) {
            UserPouch.get(query).then(function (sar) {
                sar.status = embryo.SARStatus.ENDED;
                LivePouch.put(sar).then(function () {
                    $scope.provider.doShow = false;
                    SarService.selectSar(null);
                }).catch(function (err) {
                    $log.error("getUsers - error")
                    $log.error(err)
                });
            });
        }
    }]);

    module.controller("TracklineResultController", ['$scope', 'ViewService', '$log', 'LivePouch', function ($scope, ViewService, $log, LivePouch) {
        $scope.effortAllocationProvider = ViewService.viewProviders()['effort'];

        $scope.startTracklineOperation = function(){
            try {
                $scope.alertMessages = [];
                // retain PouchDB fields like _id and _rev
                $scope.sarOperation.input = $scope.sar;

                var sarOperation = clone($scope.sarOperation)
                sarOperation.status = embryo.SARStatus.STARTED;

                LivePouch.put(sarOperation).then(function (putResponse) {

                }).then(function(sarOperation){
                    $scope.provider.close();
                }).catch(function(error){
                    $log.error("Error saving sar operation - " + startNewSar)
                    $log.error(error)
                    $log.error(typeof error)
                    if (typeof error === 'object' && error.message) {
                        $scope.alertMessages.push("Internal error: " + error.message);
                    } else if (typeof error === 'string') {
                        $scope.alertMessages.push("Internal error: " + error);
                    }
                });

            } catch (error) {
                $log.error(error)
                if (typeof error === 'object' && error.message) {
                    $scope.alertMessages.push("Internal error: " + error.message);
                } else if (typeof error === 'string') {
                    $scope.alertMessages.push("Internal error: " + error);
                }
            }

        }

        $scope.manageEffortAllocations = function () {
            $scope.effortAllocationProvider.show({sarId: $scope.sarOperation._id});
        }


    }]);

    module.controller("BackTrackPositionSelectionController", ['$scope', 'Position', function ($scope, Position) {
        if(!$scope.sar.selectedPositions){
            $scope.sar.selectedPositions = [];
        }
        SarLayerSingleton.getInstance().activatePositionSelection(function(pos){

            var objectPos = Position.create($scope.sar.objectPosition);
            var driftPos = Position.create($scope.sarOperation.output.circle.datum);
            var position = Position.create(pos)

            var distDrift = driftPos.distanceTo(objectPos);
            var distPosToDrift = position.distanceTo(driftPos);
            var distPosToObject = position.distanceTo(objectPos);

            if(Math.abs(distDrift - (distPosToDrift + distPosToObject)) < 0.1){
                var time = distPosToObject / $scope.sarOperation.output.rdv.speed;
                pos.ts = $scope.sar.objectPosition.ts - (time * 60 * 60 *1000)
            }

            $scope.sar.selectedPositions.push(pos);

            if (!$scope.$$phase) {
                $scope.$apply(function () {
                });
            }
        });
        $scope.$on("$destroy",function(){
            SarLayerSingleton.getInstance().deactivatePositionSelection();
        })
    }]);

    module.controller("SarDspController", ['$scope', function ($scope) {
        if($scope.dspToEditIndex >= 0){
            $scope.dsp = clone($scope.sar.dsps[$scope.dspToEditIndex]);
            if(!$scope.dsp.surfaceDrifts && $scope.dspToEditIndex == 0){
                $scope.dsp.surfaceDrifts = [{}];
            } else if(!$scope.dsp.surfaceDrifts && !$scope.dsp.hasOwnProperty("reuseSurfaceDrifts")){
                $scope.dsp.reuseSurfaceDrifts = true;
            }
        } else {
            if(!$scope.sar.dsps || $scope.sar.dsps.length == 0){
                $scope.dsp.surfaceDrifts = [{}];
            } else if ($scope.sar.dsps.length > 0){
                $scope.dsp.reuseSurfaceDrifts = true;
            }
        }

        $scope.changeReuse = function(){
            if(!$scope.dsp.reuseSurfaceDrifts && !$scope.dsp.surfaceDrifts){
                $scope.dsp.surfaceDrifts = [{}];
            }
        }

        $scope.add = function(){
            $scope.dsp.surfaceDrifts.push({});
        }

        $scope.removeLast = function(){
            $scope.dsp.surfaceDrifts.splice($scope.dsp.surfaceDrifts.length - 1, 1);
        }

        $scope.ok = function(dsp) {
            if($scope.dsp && $scope.dsp.reuseSurfaceDrifts){
                delete $scope.dsp.surfaceDrifts;
            }

            if($scope.dspToEditIndex >= 0){
                $scope.sar.dsps[$scope.dspToEditIndex] = dsp;
            }else {
                if(!$scope.sar.dsps){
                    $scope.sar.dsps = [];
                }
                $scope.sar.dsps.push(dsp);
            }
            $scope.page.name = "sarInputs";
        }
        $scope.cancel = function(){
            $scope.page.name = "sarInputs";
        }
    }]);


    module.controller("SARCoordinatorController", ['$scope', 'LivePouch', 'SarService', function ($scope, LivePouch, SarService) {
        $scope.coordinator = {
            user: {}
        }

        $scope.assign = function () {
            var sarOperation = SarService.setUserAsCoordinator($scope.sarOperation, $scope.coordinator.user);
            LivePouch.put(sarOperation).then(function () {
                $scope.provider.close();
            }).catch(function (error) {
                $scope.alertMessages = [error.toString()];
            })
        }
    }]);

    module.controller("SARUsersController", ['$scope', '$q', 'UserPouch', 'VesselService', 'SarService',
        function ($scope, $q, UserPouch, VesselService, SarService) {

            $scope.getUsers = function (query) {
                return function () {
                    var deferred = $q.defer();
                    UserPouch.query("users/userView", {
                        startkey: query.toLowerCase(),
                        endkey: query.toLowerCase() + "\uffff",
                        include_docs: true
                    }).then(function (result) {
                        var users = SarService.extractDbDocs(result);
                        deferred.resolve(users);
                    });
                    return deferred.promise;
                }().then(function (res) {
                    return res;
                });
                ;
            }
            $scope.getUsersAndVessels = function (query) {
                var vessels = []
                VesselService.clientSideSearch(query, function (match) {
                    vessels = match;
                })

                return function () {
                    var deferred = $q.defer();
                    UserPouch.query("users/userView", {
                        startkey: query.toLowerCase(),
                        endkey: query.toLowerCase() + "\uffff",
                        include_docs: true
                    }).then(function (result) {
                        var users = SarService.mergeQueries(result, vessels);
                        deferred.resolve(users);
                    });
                    return deferred.promise;
                }().then(function (res) {
                    return res;
                });
                ;
            }
        }]);


    var targetText = {};
    targetText[embryo.sar.effort.TargetTypes.PersonInWater] = "Person in Water (PIW)";
    targetText[embryo.sar.effort.TargetTypes.Raft1Person] = "Raft 1 person";
    targetText[embryo.sar.effort.TargetTypes.Raft4Persons] = "Raft 4 persons";
    targetText[embryo.sar.effort.TargetTypes.Raft6Persons] = "Raft 6 persons";
    targetText[embryo.sar.effort.TargetTypes.Raft8Persons] = "Raft 8 persons";
    targetText[embryo.sar.effort.TargetTypes.Raft10Persons] = "Raft 10 persons";
    targetText[embryo.sar.effort.TargetTypes.Raft15Persons] = "Raft 15 persons";
    targetText[embryo.sar.effort.TargetTypes.Raft20Persons] = "Raft 20 persons";
    targetText[embryo.sar.effort.TargetTypes.Raft25Persons] = "Raft 25 persons";
    targetText[embryo.sar.effort.TargetTypes.Motorboat15] = "Power boat < 5 m (15 ft)";
    targetText[embryo.sar.effort.TargetTypes.Motorboat20] = "Power boat 6 m (20 ft)";
    targetText[embryo.sar.effort.TargetTypes.Motorboat33] = "Power boat 10 m (33 ft)";
    targetText[embryo.sar.effort.TargetTypes.Motorboat53] = "Power boat 16 m (53 ft)";
    targetText[embryo.sar.effort.TargetTypes.Motorboat78] = "Power boat 24 m (78 ft)";
    targetText[embryo.sar.effort.TargetTypes.Sailboat15] = "Sail boat 5 m (15 ft)";
    targetText[embryo.sar.effort.TargetTypes.Sailboat20] = "Sailboat 20 feet";
    targetText[embryo.sar.effort.TargetTypes.Sailboat25] = "Sailboat 25 feet";
    targetText[embryo.sar.effort.TargetTypes.Sailboat26] = "Sail boat 8 m (26 ft)";
    targetText[embryo.sar.effort.TargetTypes.Sailboat30] = "Sailboat 30 feet";
    targetText[embryo.sar.effort.TargetTypes.Sailboat39] = "Sail boat 12 m (39 ft)";
    targetText[embryo.sar.effort.TargetTypes.Sailboat40] = "Sailboat 40 feet";
    targetText[embryo.sar.effort.TargetTypes.Sailboat49] = "Sail boat 15 m (49 ft)";
    targetText[embryo.sar.effort.TargetTypes.Sailboat50] = "Sailboat 50 feet";
    targetText[embryo.sar.effort.TargetTypes.Sailboat69] = "Sail boat 21 m (69 ft)";
    targetText[embryo.sar.effort.TargetTypes.Sailboat70] = "Sailboat 70 feet";
    targetText[embryo.sar.effort.TargetTypes.Sailboat83] = "Sail boat 25 m (83 ft)";
    targetText[embryo.sar.effort.TargetTypes.Ship120] = "Ship 120 feet";
    targetText[embryo.sar.effort.TargetTypes.Ship225] = "Ship 225 feet";
    targetText[embryo.sar.effort.TargetTypes.Ship330] = "Ship >= 330 feet";
    targetText[embryo.sar.effort.TargetTypes.Ship90to150] = "Ship 27-46 m (90-150 ft)";
    targetText[embryo.sar.effort.TargetTypes.Ship150to300] = "Ship 46-91 m (150-300 ft)";
    targetText[embryo.sar.effort.TargetTypes.Ship300] = "Ship > 91 m (300 ft)";
    targetText[embryo.sar.effort.TargetTypes.Boat17] = "Boat < 5 m (17 ft)";
    targetText[embryo.sar.effort.TargetTypes.Boat23] = "Boat 7 m (23 ft)";
    targetText[embryo.sar.effort.TargetTypes.Boat40] = "Boat 12 m (40 ft)";
    targetText[embryo.sar.effort.TargetTypes.Boat79] = "Boat 24 m (79 ft)";

    var typeText = {}
    typeText[embryo.sar.effort.SruTypes.MerchantVessel] = "Merchant vessel";
    typeText[embryo.sar.effort.SruTypes.SmallerVessel] = "Small vessel (40 feet)";
    typeText[embryo.sar.effort.SruTypes.Ship] = "Ship (50 feet)";
    typeText[embryo.sar.effort.SruTypes.Helicopter150] = "Helicopter (altitude 150 meters)";
    typeText[embryo.sar.effort.SruTypes.Helicopter300] = "Helicopter (altitude 300 meters)";
    typeText[embryo.sar.effort.SruTypes.Helicopter600] = "Helicopter (altitude 600 meters)";
    typeText[embryo.sar.effort.SruTypes.FixedWingAircraft150] = "Fixed wing aircraft (altitude 150 meters)";
    typeText[embryo.sar.effort.SruTypes.FixedWingAircraft300] = "Fixed wing aircraft (altitude 300 meters)";
    typeText[embryo.sar.effort.SruTypes.FixedWingAircraft600] = "Fixed wing aircraft (altitude 600 meters)";

    var AllocationStatusTxt = {};
    AllocationStatusTxt[embryo.sar.effort.Status.Active] = "Shared";
    AllocationStatusTxt[embryo.sar.effort.Status.DraftSRU] = "No sub area";
    AllocationStatusTxt[embryo.sar.effort.Status.DraftZone] = "Not shared";
    AllocationStatusTxt[embryo.sar.effort.Status.DraftPattern] = "Not shared";
    AllocationStatusTxt[embryo.sar.effort.Status.DraftModifiedOnMap] = "Not shared";

    var AllocationStatusLabel = {};
    AllocationStatusLabel[embryo.sar.effort.Status.Active] = "label-success";
    AllocationStatusLabel[embryo.sar.effort.Status.DraftSRU] = "label-danger";
    AllocationStatusLabel[embryo.sar.effort.Status.DraftZone] = "label-danger";
    AllocationStatusLabel[embryo.sar.effort.Status.DraftPattern] = "label-danger";
    AllocationStatusLabel[embryo.sar.effort.Status.DraftModifiedOnMap] = "label-danger";

    var patternTexts = {}
    patternTexts[embryo.sar.effort.SearchPattern.CreepingLine] = "Creeping line search";
    patternTexts[embryo.sar.effort.SearchPattern.ParallelSweep] = "Parallel sweep search";
    patternTexts[embryo.sar.effort.SearchPattern.SectorSearch] = "Sector search";
    patternTexts[embryo.sar.effort.SearchPattern.ExpandingSquare] = "Expanding square search";
    patternTexts[embryo.sar.effort.SearchPattern.TrackLineNonReturn] = "Track line search, non-return";
    patternTexts[embryo.sar.effort.SearchPattern.TrackLineReturn] = "Track line search, return";


    function clone(object) {
        return JSON.parse(JSON.stringify(object));
    }

    module.controller("SarEffortAllocationController", ['$scope', 'Operation', 'ViewService', 'SarService', 'LivePouch', 'SarOperationFactory', '$log', "SarTableFactory", "TrackLineReturn", "TrackLineNonReturn",
        function ($scope, Operation, ViewService, SarService, LivePouch, SarOperationFactory, $log, SarTableFactory, TrackLineReturn, TrackLineNonReturn) {
            $scope.alertMessages = [];
            $scope.message = null;
            $scope.srus = [];
            $scope.Operation = Operation

            $scope.AllocationStatus = embryo.sar.effort.Status;

            $scope.AllocationStatusTxt = AllocationStatusTxt;
            $scope.AllocationStatusLabel = AllocationStatusLabel;

            $scope.fatigues = [0.5, 1.0];
            $scope.targetText = targetText;

            $scope.typeText = typeText;
            $scope.sruTypes = [
                embryo.sar.effort.SruTypes.MerchantVessel,
                /*embryo.sar.effort.SruTypes.SmallerVessel,
                embryo.sar.effort.SruTypes.Ship,*/
                embryo.sar.effort.SruTypes.Helicopter150,
                embryo.sar.effort.SruTypes.Helicopter300,
                embryo.sar.effort.SruTypes.Helicopter600,
                embryo.sar.effort.SruTypes.FixedWingAircraft150,
                embryo.sar.effort.SruTypes.FixedWingAircraft300,
                embryo.sar.effort.SruTypes.FixedWingAircraft600,
            ]

            $scope.patternTexts = patternTexts;

            //$scope.visibilityValues = [1, 3, 5, 10, 15, 20];


            function loadAllocation(allocationId) {
                // find docs where sarId === selectedSarId
                LivePouch.get(allocationId).then(function (allocation) {
                    $scope.effort = allocation;
                    $scope.initEffortAllocation();
                }).catch(function (error) {
                    $log.error("loadAllocation(" + allocationId + ") error")
                    $log.error(error)
                });
            }

            function patternsMap(patterns) {
                var result = {};
                for (var index in patterns) {
                    var pattern = patterns[index];
                    if (!result[pattern.effId] || pattern.status != embryo.sar.effort.Status.Active) {
                        result[pattern.effId] = {
                            id: pattern._id,
                            status: pattern.status,
                            type : pattern.type
                        };
                    }
                }
                return result
            }

            function loadSRUs() {
                //TODO request both search pattern and zones
                // build 2 structures
                // one array of zones/srus
                // one array of zones/srus
                // one object/array of search patterns
                // use the latter for determining the button to display and implementing the next action

                $scope.srus = []
                // find docs where sarId === selectedSarId
                LivePouch.query('sar/effortView', {
                    key: $scope.sarId,
                    include_docs: true
                }).then(function (result) {
                    var srus = [];
                    var patterns = [];
                    for (var index in result.rows) {
                        if (result.rows[index].doc['@type'] === embryo.sar.Type.SearchPattern) {
                            patterns.push(result.rows[index].doc)
                        } else {
                            srus.push(result.rows[index].doc)
                        }
                    }
                    $scope.srus = srus
                    $scope.patterns = patternsMap(patterns);
                }).catch(function (error) {
                    $log.error(error)
                });
            }

            $scope.provider = {
                doShow: false,
                title: "SarEffortAllocation",
                type: "effort",
                show: function (context) {
                    $scope.alertMessages = null;
                    $scope.message = null;
                    $scope.page = context && context.page ? context.page : 'SRU';

                    if (context && context.sarId) {
                        $scope.sarId = context.sarId
                        LivePouch.get($scope.sarId).then(function (sar) {
                            $scope.sar = sar;
                        })
                        $scope.toSrus();
                    } else if (context && context.allocationId) {
                        loadAllocation(context.allocationId)
                    }

                    this.doShow = true;

                },
                close: function () {
                    SarLayerSingleton.getInstance().removeTemporarySearchPattern();
                    this.doShow = false;
                }
            };
            ViewService.addViewProvider($scope.provider);

            $scope.close = function ($event) {
                $event.preventDefault();
                $scope.provider.close();
            };

            $scope.newUnit = function () {
                $scope.sru = {
                    fatigue: 1.0,
                    type: embryo.sar.effort.SruTypes.MerchantVessel,
                    time: 1
                }
                $scope.page = 'editUnit';
            };


            $scope.editSRU = function ($event, SRU) {
                $event.preventDefault();
                $scope.sru = clone(SRU);
                $scope.page = 'editUnit';
            }

            $scope.toConfirmDelSRU = function ($event, SRU) {
                $event.preventDefault();
                $scope.sru = SRU;
                $scope.alertMessages = null;
                $scope.message = null;
                $scope.page = 'deleteSRU';
            }

            $scope.removeSRU = function (SRU) {
                LivePouch.query('sar/effortView', {
                    key: SRU.sarId,
                    include_docs: true
                }).then(function (result) {
                    var toRemove = [];
                    for (var index in result.rows) {
                        var doc = result.rows[index].doc;
                        if (doc['@type'] === embryo.sar.Type.EffortAllocation && doc._id == SRU._id
                            || doc['@type'] === embryo.sar.Type.SearchPattern && doc.effId === SRU._id) {
                            toRemove.push(doc)
                            doc._deleted = true;
                        }
                    }

                    //delete allocations and search patterns
                    return LivePouch.bulkDocs(toRemove)
                }).then(function () {
                    $scope.toSrus();
                }).catch(function (error) {
                    $scope.alertMessages = ["Internal error removing SRU", error];
                    $log.error(error)
                });
            }

            $scope.toSrus = function () {
                $scope.alertMessages = null;
                $scope.message = null;
                loadSRUs();
                $scope.page = "SRU";
            }

            $scope.initEffortAllocation = function () {
                $scope.alertMessages = null;
                $scope.message = null;
                if (!$scope.effort) {
                    $scope.effort = {}
                }

                var sweepWidthTable = SarTableFactory.getSweepWidthTable($scope.effort.type)
                $scope.visibilityValues = sweepWidthTable.visibilityOptions();
                $scope.targetTypes = sweepWidthTable.searchObjectOptions();

                var type = $scope.effort.type;

                var latest = SarService.latestEffortAllocationZone($scope.srus, function (zone) {
                    return !type || zone.type === type;
                });

                if (!$scope.effort.target) {
                    $scope.effort.target = latest ? latest.target : embryo.sar.effort.TargetTypes.PersonInWater;
                }
                if (!$scope.effort.visibility) {
                    $scope.effort.visibility = latest ? latest.visibility : $scope.visibilityValues[0];
                }
                if (!$scope.effort.pod) {
                    $scope.effort.pod = latest ? latest.pod : 78;
                }
                if (!$scope.effort.waterElevation && latest) {
                    $scope.effort.waterElevation = latest.waterElevation;
                }
                if (!$scope.effort.wind && latest) {
                    $scope.effort.wind = latest.wind;
                }

                if ($scope.effort.status === embryo.sar.effort.Status.Active && $scope.sar.input.type !== Operation.TrackLine) {
                    $scope.message = "Sub area is edited by creating a copy of the existing shared sub area. \n";
                    $scope.message += "Write new values below, Calculate sub area, drag and shape sub area on the map and Share it. ";
                    $scope.message += "Your will hereby also replace the existing shared sub area. ";
                }
            }

            $scope.toSubAreaCalculation = function (effort, $event) {
                console.log($event)
                if($event){
                    $event.preventDefault();
                }
                $scope.effort = clone(effort);
                $scope.initEffortAllocation();
                $scope.page = "effort";
            }

            $scope.confirmActivation = function (effort) {
                $scope.effort = effort;
                $scope.page = "activate";
            }

            $scope.calculate = function () {

                if ($scope.effort.status === embryo.sar.effort.Status.Active) {
                    delete $scope.effort._rev;
                    delete $scope.effort.area;
                    $scope.effort._id = "sarEf-" + Date.now();
                }

                LivePouch.get($scope.effort.sarId).then(function (sar) {
                    var allocation = null;
                    try {
                        allocation = SarService.calculateEffortAllocations($scope.effort, sar);
                    } catch (error) {
                        $log.error(error)
                        $scope.alertMessages = ["internal error", error];
                    }

                    if (allocation) {
                        LivePouch.put(allocation).then(function () {
                            // TODO fix problem. View closing after first save
                            $scope.provider.close();
                        }).catch(function (error) {
                            $scope.alertMessages = ["internal error", error];
                        });
                    }
                }).catch(function (error) {
                    $scope.alertMessages = ["internal error", error];
                    $log.error(error)
                });
            }

            $scope.calculateTrackSpacing = function () {
                if ($scope.effort.status === embryo.sar.effort.Status.Active) {
                    delete $scope.effort._rev;
                    delete $scope.effort.area;
                    $scope.effort._id = "sarEf-" + Date.now();
                }

                LivePouch.get($scope.effort.sarId).then(function (sar) {
                    var allocation = null;
                    try {
                        allocation = SarService.calculateTrackSpacing($scope.effort);
                        allocation.status = embryo.sar.effort.Status.Active
                    } catch (error) {
                        $log.error(error)
                        $scope.alertMessages = ["internal error", error];
                    }

                    if (allocation) {
                        LivePouch.put(allocation).then(function () {
                            // TODO fix problem. View closing after first save
                            $scope.toSrus();
                        }).catch(function (error) {
                            $scope.alertMessages = ["internal error", error];
                        });
                    }
                }).catch(function (error) {
                    $scope.alertMessages = ["internal error", error];
                    $log.error(error)
                });
            }

            $scope.activate = function () {
                // CONFIRM calculation and movement within circle before sending to other vessels
                // this to minimize data traffic
                function persist(eff) {
                    var effort = clone(eff);
                    effort.status = embryo.sar.effort.Status.Active;
                    // FIXME can not rely on local computer time
                    effort.modified = Date.now();
                    LivePouch.put(effort).then(function () {
                        $scope.toSrus();
                    }).catch(function (error) {
                        $log.error("error saving effort allocation")
                        $log.error(error)
                    })
                }

                function deleteEffortAllocationsForSameUser(effort) {
                    LivePouch.query('sar/effortView', {
                        key: effort.sarId,
                        include_docs: true
                    }).then(function (result) {
                        var efforts = [];
                        for (var index in result.rows) {
                            var doc = result.rows[index].doc;

                            if (doc['@type'] === embryo.sar.Type.EffortAllocation && doc.name == effort.name
                                && doc._id !== effort._id) {

                                efforts.push(doc)
                                doc._deleted = true;
                            } else if (doc['@type'] === embryo.sar.Type.SearchPattern && doc.name === effort.name) {
                                efforts.push(doc)
                                doc._deleted = true;
                            }
                        }

                        //delete allocations and search patterns

                        return LivePouch.bulkDocs(efforts)
                    }).then(function () {
                        persist(effort);
                    }).catch(function (err) {
                        $log.error("deleteEffortAllocationsForSameUser - error")
                        $log.error(err)
                    });
                }

                deleteEffortAllocationsForSameUser($scope.effort);
            }

            function pattern(type, text) {
                return {
                    type: type,
                    label: text
                }
            }

            function initSearchPattern(zone, latest) {
                var SearchPattern = embryo.sar.effort.SearchPattern;
                var AllocationStatus = embryo.sar.effort.Status;

                $scope.sides = [
                    {
                        key : embryo.sar.effort.Side.Starboard,
                        label : "Starboard (default)"
                    },{
                        key : embryo.sar.effort.Side.Port,
                        label : "Port"
                    }
                ]
                $scope.sp.turn = $scope.sides[0].key

                if($scope.sar.input.type === Operation.TrackLine) {
                    $scope.patterns = [
                        pattern(SearchPattern.TrackLineReturn, "Track line search, return"),
                        pattern(SearchPattern.TrackLineNonReturn, "Track line search, non-return"),
                    ];
                } else if(zone.status == AllocationStatus.DraftSRU){
                    $scope.patterns = [
                        pattern(SearchPattern.SectorSearch, "Sector search"),
                    ]
                }else {
                    $scope.patterns = [
                        pattern(SearchPattern.ParallelSweep, "Parallel sweep search"),
                        pattern(SearchPattern.CreepingLine, "Creeping line search"),
                        pattern(SearchPattern.ExpandingSquare, "Expanding square search"),
                        pattern(SearchPattern.SectorSearch, "Sector search"),
                    ]

                    $scope.other = {
                        corners: SarService.searchPatternCspLabels(zone)
                    };
                }

                // FIXME latest.type may not be available of latest was CreepingLine, but AllocationStatus === DrafSRU and only SectorSearch is available
                $scope.sp = {
                    type: latest && latest.type ? latest.type : $scope.patterns[0].type
                };

                var found = false;
                for(var index in $scope.patterns){
                    if($scope.patterns[index].type === $scope.sp.type){
                        found = true;
                        break;
                    }
                }
                if(!found){
                    $scope.sp.type = $scope.patterns[0].type
                }

                $scope.SearchPattern = embryo.sar.effort.SearchPattern;
                $scope.spImages = {};
                $scope.spImages[SearchPattern.ParallelSweep] = "img/sar/parallelsweepsearch.png";
                $scope.spImages[SearchPattern.CreepingLine] = "img/sar/creepinglinesearch.png";
                $scope.spImages[SearchPattern.ExpandingSquare] = "img/sar/expandingsquaresearch.png";
                $scope.spImages[SearchPattern.SectorSearch] = "img/sar/searchSectorPattern.png ";
                $scope.spImages[SearchPattern.TrackLineReturn] = "img/sar/tracklinesearchreturn.png";
                $scope.spImages[SearchPattern.TrackLineNonReturn] = "img/sar/tracklinesearchnonreturn.png";
            }

            function findNewestSearchPattern(zone, init) {
                LivePouch.query('sar/searchPattern', {
                    key: zone.sarId,
                    include_docs: true
                }).then(function (result) {
                    var patterns = [];
                    for (var index in result.rows) {
                        patterns.push(result.rows[index].doc);
                    }
                    init(zone, SarService.findLatestModified(patterns));
                }).catch(function (error) {
                    $log.error("findNewestSearchPattern error")
                    $log.error(error)
                });

            }

            $scope.createSearchPattern = function (zone) {
                $scope.page = "searchPattern";
                $scope.sp = {};
                $scope.zone = zone;
                LivePouch.get(zone.sarId).then(function (sar) {
                    $scope.sar = sar;
                    findNewestSearchPattern(zone, initSearchPattern);
                })
            }

            $scope.editSearchPattern = function (zone, spId, $event) {
                if($event){
                    $event.preventDefault();
                }
                $scope.sp = {};
                LivePouch.get(spId).then(function (pattern) {
                    $scope.page = "searchPattern";
                    $scope.zone = zone;
                    initSearchPattern(zone)
                    $scope.origPattern = clone(pattern);
                    $scope.sp = clone(pattern);
                    $scope.searchPattern = pattern;

                    if (pattern.wps && pattern.wps.length > 0) {
                        $scope.sp.csp = {
                            lon: pattern.wps[0].longitude,
                            lat: pattern.wps[0].latitude
                        };
                    }
                    return LivePouch.get(zone.sarId)
                }).then(function (sar) {
                    $scope.sar = sar;
                }).catch(function (error) {
                    // FIXME don't treat error as a string be default.
                    $scope.errorMessages = [error];
                    $log.error(error)
                });
            }

            $scope.calculateCSP = function () {
                if ($scope.sp && $scope.sp.cornerKey && $scope.sp.cornerKey !== "") {
                    $scope.sp.csp = SarService.calculateCSP($scope.zone, $scope.sp.cornerKey)
                } else {
                    $scope.sp.csp = null;
                }

                this.generateSearchPattern();
            }

            $scope.calculateSectorCsp = function () {
                if ($scope.sp && $scope.sp.radius && $scope.sp.direction) {
                    try {
                        var spCopy = clone($scope.sp);
                        spCopy.sar = $scope.sar;

                        $scope.sp.csp = SarService.calculateSectorCsp($scope.zone, spCopy)
                    }catch(error){
                        console.log(error)
                        $log.error(error);
                    }
                }

                this.generateSearchPattern();
            }

            $scope.$watch("sp.direction", function(newValue, oldValue){
                $scope.calculateSectorCsp();
            })


            $scope.generateSearchPattern = function () {
                if(!$scope.sp){
                    return;
                }

                try{
                    if (($scope.sp.type === embryo.sar.effort.SearchPattern.ParallelSweep || $scope.sp.type === embryo.sar.effort.SearchPattern.CreepingLine)
                        && $scope.sp.csp && $scope.sp.csp.lon && $scope.sp.csp.lat) {
                        $scope.searchPattern = SarService.generateSearchPattern($scope.zone, $scope.sp);
                        SarLayerSingleton.getInstance().drawTemporarySearchPattern($scope.searchPattern);
                    } else if ($scope.sp.type === embryo.sar.effort.SearchPattern.ExpandingSquare) {
                        var spCopy = clone($scope.sp);
                        spCopy.sar = $scope.sar;
                        $scope.searchPattern = SarService.generateSearchPattern($scope.zone, spCopy);
                        SarLayerSingleton.getInstance().drawTemporarySearchPattern($scope.searchPattern);
                    } else if($scope.sp.type === embryo.sar.effort.SearchPattern.SectorSearch && $scope.sp && $scope.sp.radius && $scope.sp.direction){
                        var spCopy = clone($scope.sp);
                        spCopy.sar = $scope.sar;
                        $scope.searchPattern = SarService.generateSearchPattern($scope.zone, spCopy);
                        SarLayerSingleton.getInstance().drawTemporarySearchPattern($scope.searchPattern);
                    } else if($scope.sp.type === embryo.sar.effort.SearchPattern.TrackLineReturn  && $scope.sp.direction && $scope.sp.turn){
                        $scope.searchPattern = TrackLineReturn.calculate($scope.zone, $scope.sp, $scope.sar);
                        SarLayerSingleton.getInstance().drawTemporarySearchPattern($scope.searchPattern);
                    } else if($scope.sp.type === embryo.sar.effort.SearchPattern.TrackLineNonReturn && $scope.sp.direction && $scope.sp.turn){
                        $scope.searchPattern = TrackLineNonReturn.calculate($scope.zone, $scope.sp, $scope.sar);
                        SarLayerSingleton.getInstance().drawTemporarySearchPattern($scope.searchPattern);
                    }
                }catch(error){
                    $log.error(error)
                }
            }

            $scope.cancelPattern = function () {
                $scope.sp = {}
                SarLayerSingleton.getInstance().removeTemporarySearchPattern();
                $scope.toSrus();

            }

            function replaceSearchPattern(searchPattern) {
                LivePouch.query('sar/searchPattern', {
                    key: searchPattern.sarId,
                    include_docs: true
                }).then(function (result) {
                    var searchPatterns = [];
                    for (var index in result.rows) {
                        var doc = result.rows[index].doc;
                        if (doc.effId == searchPattern.effId && doc._id !== searchPattern._id) {
                            searchPatterns.push(doc)
                            doc._deleted = true;
                        }
                    }
                    //delete allocations and search patterns
                    return LivePouch.bulkDocs(searchPatterns)
                }).then(function () {
                    saveSearchPattern(searchPattern);
                }).catch(function (err) {
                    $log.error("deleteEffortAllocationsForSameUser - error")
                    $log.error(err)
                });
            }


            function saveSearchPattern(pattern) {
                LivePouch.put(pattern).then(function () {
                    SarLayerSingleton.getInstance().removeTemporarySearchPattern();
                    $scope.toSrus();
                }).catch(function (err) {
                    // FIXME, don't just assume error is a String
                    $scope.errorMessages = [err];
                });
            }

            $scope.draftSearchPattern = function () {
                var pattern = clone($scope.searchPattern);
                pattern.status = embryo.sar.effort.Status.DraftPattern;
                replaceSearchPattern(pattern);
            }

            $scope.shareSearchPattern = function () {
                var pattern = clone($scope.searchPattern);
                pattern.status = embryo.sar.effort.Status.Active;
                replaceSearchPattern(pattern);
            }

            $scope.$on("$destroy", function () {
                SarLayerSingleton.getInstance().removeTemporarySearchPattern();
            })
        }]);

    module.controller("Trackline", ['$scope', function ($scope) {
        SarLayerSingleton.getInstance().activateTrackLinePositioning(function(pos){
            $scope.sp.dragPoint = pos;
            $scope.generateSearchPattern();
        });

        $scope.directions = [
            {
                key : embryo.sar.effort.TrackLineDirection.AsRoute,
                label : "Same as route (default)"
            },{
                key : embryo.sar.effort.TrackLineDirection.OppositeRoute,
                label : "Opposite route"
            }
        ];

        if(!$scope.zone.direction){
            $scope.zone.direction = $scope.directions[0].key
        }


        $scope.$on("$destroy", function () {
            SarLayerSingleton.getInstance().deactivateTrackLinePositioning();
        })
    }]);



    module.controller("SarSruController", ['$scope', 'SarService', 'LivePouch', '$log', function ($scope, SarService, LivePouch, $log) {
        $scope.alertMessages = null;
        $scope.message = null;

        $scope.participant = {
            user: {}
        }
        if ($scope.sru.name) {
            $scope.participant.user.name = $scope.sru.name;
        }
        if ($scope.sru.mmsi) {
            $scope.participant.user.mmsi = $scope.sru.mmsi;
        }

        $scope.saveUnit = function () {
            // If active, then make a new copy in status draft
            // the copy will replace the active zone, when itself being activated
            // TODO move much of this code into EffortAllocation where easier to unit test.
            var sru = clone($scope.sru);
            sru.name = $scope.participant.user.name;
            sru.mmsi = $scope.participant.user.mmsi;
            if (sru.status === embryo.sar.effort.Status.Active) {
                delete sru._id;
                delete sru._rev;
                delete sru.area;
            }
            if (sru.status === embryo.sar.effort.Status.DraftZone) {
                delete sru.area;
                sru.status = embryo.sar.effort.Status.DraftSRU;
            }
            if (!sru._id) {
                sru.sarId = $scope.sarId;
                sru._id = "sarEf-" + Date.now();
                sru['@type'] = embryo.sar.Type.EffortAllocation;
                sru.status = embryo.sar.effort.Status.DraftSRU;
            }
            var sru2 = $scope.sru;
            // FIXME can not rely on local computer time
            sru.modified = Date.now();
            $scope.sru = null;
            LivePouch.put(sru).then(function (result) {
                $scope.toSrus();
            }).catch(function (error) {
                $scope.sru = sru2;
                $scope.alertMessages = ["internal error", error];
                $log.error(error)
            });

        }
    }]);

})();
