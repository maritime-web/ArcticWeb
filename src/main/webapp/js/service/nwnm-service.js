(function() {
    var module = angular.module('embryo.nwnm.service', []);

    module.service('NWNMService', [ '$http', 'CookieService', '$interval', function($http, CookieService, $interval) {
        var subscription = null;
        var service = null;
        var interval = 60 * 1000 * 60;

        function notifySubscribers() {
            if (subscription) {
                for ( var i in subscription.callbacks) {
                    if (subscription.callbacks[i]) {
                        if (subscription.error) {
                            subscription.callbacks[i](subscription.error);
                        } else {
                            subscription.callbacks[i](null, subscription.messages, subscription.regions, subscription.selectedRegions);
                        }
                    }
                }
            }
        }

        function getNWNMData() {
            function getMessages(){
                subscription.selectedRegions = service.getSelectedRegions();
                if(!subscription.selectedRegions){
                    var regionNames = service.regions2Array(subscription.regions, true);
                    service.setSelectedRegions(regionNames);
                }
                service.list(subscription.selectedRegions, function(messages){
                    subscription.messages = messages;
                    notifySubscribers();
                }, function(error, status){
                    subscription.error = error;
                    notifySubscribers();
                });
            }

            subscription.error = null;

            if (!subscription.regions) {
                service.regions(function(regions) {
                    subscription.regions = regions;
                    getMessages();
                }, function (errorMsg){
                    subscription.error = errorMsg;
                    notifySubscribers();
                });
            }else{
                getMessages();
            }
        }

        function toViewType(messages) {
            var res = [];

            function augmentMessage(m) {
                m.enctext = m.descs[0].title;
                m.areaHeading = getAreaHeading(m);
                m.jsonFeatures = getMessagePartFeatures(m);

                var now = moment();
                var partActiveNow = m.parts.find(function (part) {
                    if (part.eventDates) {
                        return part.eventDates.find(function (dateInterval) {
                            return now.isSameOrAfter(moment(dateInterval.fromDate)) && now.isSameOrBefore(moment(dateInterval.toDate));
                        });
                    } else {
                        return false;
                    }
                });
                m.isActive = (m.status === "PUBLISHED") && partActiveNow;


                return m;
            }

            /** Returns the list of GeoJson features of all message parts **/
            function getMessagePartFeatures (message) {
                var g = [];
                if (message && message.parts) {
                    angular.forEach(message.parts, function (part) {
                        if (part.geometry && part.geometry.features && part.geometry.features.length > 0) {
                            g.push(angular.toJson(part.geometry));
                        }
                    })
                }
                return g;
            }

            /** Returns the area heading for the given message, i.e. two root-most areas **/
            function getAreaHeading (message) {
                if (message && message.areas && message.areas.length > 0) {
                    var area = message.areas[0];
                    while (area.parent && area.parent.parent) {
                        area = area.parent;
                    }
                    var heading = '';
                    if (area.parent) {
                        heading += area.parent.descs[0].name + ' - ';
                    }
                    heading += area.descs[0].name;
                    return heading;
                }
                return '';
            }

            angular.forEach(messages, function (m) {
                res.push(augmentMessage(m));
            });

            return res;
        }

        service = {
            regions2Array : function(regions, all) {
                var result = [];
                for ( var x in regions) {
                    if (all || regions[x].selected) {
                        result.push(regions[x].name);
                    }
                }
                return result;
            },
            list : function(regions, success, error) {
                var messageId = embryo.messagePanel.show({
                    text : "Requesting active NW and NM messages ..."
                });
                
                var params = 'lang=en';

                params += '&instanceId=' + encodeURIComponent('NWNM');

                $http.get(embryo.baseUrl + "/rest/nw-nm/messages?" + params, {
                    timeout : embryo.defaultTimeout
                }).success(function(messages){
                    embryo.messagePanel.replace(messageId, {
                        text : messages.length + " NW-NM messages returned.",
                        type : "success"
                    });
                    success(toViewType(messages));
                }).error(function(data, status, headers, config) {
                    var errorMsg = embryo.ErrorService.errorStatus(data, status, "requesting NW-NM messagess");
                    embryo.messagePanel.replace(messageId, {
                        text : errorMsg,
                        type : "error"
                    });
                    error(errorMsg, status);
                });
            },
            regions : function(success, error) {
/*
                $http.get(embryo.baseUrl + 'rest/msi/regions', {
                    timeout : embryo.defaultTimeout
                }).success(success).error(function(data, status, headers, config) {
                    error(embryo.ErrorService.errorStatus(data, status, "requesting NW-NM areas"), status);
                });
*/
                var regions = [
                    'GL', 'DK'
                ];
                success(regions);
            },
            setSelectedRegions : function(regions) {
                CookieService.set("dma-msi-regions-" + embryo.authentication.userName, regions, 30);
            },
            getSelectedRegions : function() {
                return CookieService.get("dma-msi-regions-" + embryo.authentication.userName);
            },
            subscribe : function(callback) {
                if (subscription == null) {
                    subscription = {
                        callbacks : [],
                        regions : null,
                        messagess : null,
                        interval : null
                    };
                }
                var id = subscription.callbacks.push(callback);

                if (subscription.interval == null) {
                    subscription.interval = $interval(getNWNMData, interval);
                    getNWNMData();
                }else if (subscription.error) {
                    callback(subscription.error, null, null, null);
                } else if (subscription.messages) {
                    callback(null, subscription.messages, subscription.regions, subscription.selectedRegions);
                }
                return {
                    id : id
                };
            },
            unsubscribe : function(id) {
                subscription.callbacks[id.id] = null;
                var allDead = true;
                for ( var i in subscription.callbacks)
                    allDead &= subscription.callbacks[i] == null;
                if (allDead) {
                    clearInterval(subscription.interval);
                    subscription = null;
                }
            },
            update : function(){
                if(subscription.interval){
                    $interval.cancel(subscription.interval);
                    subscription.interval = $interval(getNWNMData, interval);
                }
                getNWNMData();
            }
        };

        return service;
    } ]);
})();
