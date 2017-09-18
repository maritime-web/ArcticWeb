/********************************
 * Renders a badge with the message
 * ID and a colour that signals the
 * current status
 ********************************/
(function () {
    angular.module('embryo.nwnm')
        .directive('messageIdBadge', [function () {
            'use strict';

            return {
                restrict: 'E',
                template: '<span class="label label-message-id" ng-class="messageClass">{{shortId}}</span>{{suffix}}',
                scope: {
                    msg: "=",
                    showBlank: "="
                },
                link: function (scope) {

                    function updateSuffix() {
                        var msg = scope.msg;
                        if (msg && msg.mainType === 'NM' &&
                            (msg.type === 'TEMPORARY_NOTICE' || msg.type === 'PRELIMINARY_NOTICE')) {
                            scope.suffix = msg.type === 'TEMPORARY_NOTICE' ? ' (T)' : ' (P)';
                        }
                    }

                    /** Updates the label based on the current status and short ID **/
                    function updateIdLabel() {
                        scope.suffix = '';
                        var msg = scope.msg;
                        var status = msg && msg.status ? msg.status : 'DRAFT';
                        scope.messageClass = 'status-' + status;

                        scope.shortId = '';
                        if (msg && msg.shortId) {
                            scope.shortId = msg.shortId;
                            updateSuffix();
                        } else if (msg && scope.showBlank) {
                            var typeDesc = '';
                            if (msg.type) {
                                switch (msg.type) {
                                    case "TEMPORARY_NOTICE":
                                        typeDesc = "Temp.";
                                        break;
                                    case "PRELIMINARY_NOTICE":
                                        typeDesc = "Prelim.";
                                        break;
                                    case "PERMANENT_NOTICE":
                                        typeDesc = "Perm.";
                                        break;
                                    case "MISCELLANEOUS_NOTICE":
                                        typeDesc = "Misc.";
                                        break;
                                    case "LOCAL_WARNING":
                                        typeDesc = "Local";
                                        break;
                                    case "COASTAL_WARNING":
                                        typeDesc = "Coastal";
                                        break;
                                    case "SUBAREA_WARNING":
                                        typeDesc = "Subarea";
                                        break;
                                    case "NAVAREA_WARNING":
                                        typeDesc = "Navarea";
                                        break;
                                }
                            }
                            scope.shortId = msg.type ? typeDesc + ' ' : '';
                            scope.shortId = scope.shortId + (msg.mainType ? msg.mainType : '');
                            scope.messageClass += '-outline';
                        }
                    }

                    scope.$watch('[msg.shortId, msg.status, msg.mainType, msg.type]', updateIdLabel, true);
                }
            }
        }])
})();