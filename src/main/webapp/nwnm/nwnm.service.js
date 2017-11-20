(function () {
    var module = angular.module('embryo.nwnm');

    module.service('NWNMService', NWNMService);
    NWNMService.$inject = ['$http', 'CookieService', '$interval'];

    function NWNMService($http, CookieService, $interval) {
        var subscription = null;
        var service = null;
        var interval = 60 * 1000 * 60;

        function notifySubscribers() {
            if (subscription) {
                for (var i in subscription.callbacks) {
                    if (subscription.callbacks[i]) {
                        if (subscription.error) {
                            subscription.callbacks[i](subscription.error);
                        } else {
                            subscription.callbacks[i](null, subscription.messages);
                        }
                    }
                }
            }
        }

        function getNWNMData() {
            subscription.error = null;
            getMessages();

            function getMessages() {
                service.list(function (messages) {
                    subscription.messages = messages;
                    notifySubscribers();
                }, function (error, status) {
                    subscription.error = error;
                    notifySubscribers();
                });
            }
        }

        function toViewType(messages) {
            var res = [];

            function augmentMessage(m) {
                m.enctext = m.descs[0].title;
                m.areaHeading = getAreaHeading(m);
                m.mainArea = getMainArea(m);
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
            function getMessagePartFeatures(message) {
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
            function getAreaHeading(message) {
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

            function getMainArea(m) {
                if (m && m.areas && m.areas.length > 0) {
                    var area = m.areas[0];
                    while (area.parent) {
                        area = area.parent;
                    }
                    return area;
                }
                return null;
            }

            angular.forEach(messages, function (m) {
                res.push(augmentMessage(m));
            });

            return res;
        }

        service = {
            list: function (success, error) {
                var messageId = embryo.messagePanel.show({
                    text: "Requesting active NW and NM messages ..."
                });

                var params = 'lang=en';

                params += '&instanceId=' + encodeURIComponent('NWNM');

                $http.get(embryo.baseUrl + "/rest/nw-nm/messages?" + params, {
                    timeout: embryo.defaultTimeout
                }).then(function (response) {
                    var messages = response.data;
                    embryo.messagePanel.replace(messageId, {
                        text: messages.length + " NW-NM messages returned.",
                        type: "success"
                    });
                    success(toViewType(messages));
                }).catch(function (response) {
                    var errorMsg = embryo.ErrorService.errorStatus(response.data, response.status, "requesting NW-NM messagess");
                    embryo.messagePanel.replace(messageId, {
                        text: errorMsg,
                        type: "error"
                    });
                    error(errorMsg, response.status);
                });
            },
            getFilterState: function () {
                return CookieService.get("dma-msi-filters-" + embryo.authentication.userName);
            },
            setFilterState: function (state) {
                CookieService.set("dma-msi-filters-" + embryo.authentication.userName, state, 30);
            },
            subscribe: function (callback) {
                if (subscription === null) {
                    subscription = {
                        callbacks: [],
                        regions: null,
                        messagess: null,
                        interval: null
                    };
                }
                var id = subscription.callbacks.push(callback);

                if (subscription.interval === null) {
                    subscription.interval = $interval(getNWNMData, interval);
                    getNWNMData();
                } else if (subscription.error) {
                    callback(subscription.error, null);
                } else if (subscription.messages) {
                    callback(null, subscription.messages);
                }
                return {
                    id: id
                };
            },
            unsubscribe: function (id) {
                subscription.callbacks[id.id] = null;
                var allDead = true;
                for (var i in subscription.callbacks)
                    allDead &= subscription.callbacks[i] === null;
                if (allDead) {
                    clearInterval(subscription.interval);
                    subscription = null;
                }
            },
            update: function () {
                if (subscription.interval) {
                    $interval.cancel(subscription.interval);
                    subscription.interval = $interval(getNWNMData, interval);
                }
                getNWNMData();
            }
        };

        return service;
    }
})();
