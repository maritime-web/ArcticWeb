/*globals angular, moment, jQuery */
/*jslint vars:true */

(function() {
    "use strict";

    var module = angular.module('embryo.datepicker', []);

    module.directive('datetimepicker', ['$document', function($document) {
        return {
            require : '^ngModel',
            restrict : 'E',
            replace : true,
            template : '<div class="input-group date" data-date-format="YYYY-MM-DD HH:mm">'
                    + '<input type="text" class="input-sm form-control" />' + '<span class="input-group-addon">'
                    + ' <span class="fa fa-calendar"></span>' + '</span>' + '</div>',
            //              
            // '<div>' +
            // '<input type="text" readonly data-date-format="yyyy-mm-dd hh:ii"
            // name="recipientDateTime" data-date-time required>'+
            // '</div>',
            link : function(scope, element, attrs, ngModelController) {
                $(element).datetimepicker({
                    format: 'YYYY-MM-DD HH:mm',
                    locale : 'da',
                    useCurrent : true,
                    showTodayButton : true,
                    focusOnShow: false,
                    debug: false,
                    icons : {
                        time : 'fa fa-clock-o',
                        date : 'fa fa-calendar',
                        up : 'fa fa-chevron-up',
                        down : 'fa fa-chevron-down'
                    }
                });
                var picker = $(element).data('DateTimePicker');

                //The default key bindings of version 4.17.45 prevents cursor movement in the input field hence the modified bindings below
                var defaultKeyBinds = picker.keyBinds();
                var customKeyBinds = Object.assign({}, defaultKeyBinds);
                customKeyBinds.left = "disabled";
                customKeyBinds.right = "disabled";
                customKeyBinds['delete'] = "disabled";
                picker.keyBinds(customKeyBinds);

                ngModelController.$formatters.push(function(modelValue) {
                    var adjustedDate;
                    if (!modelValue) {
                        adjustedDate = null;
                        picker.date(null);
                    } else {
                        adjustedDate = adjustDateForUTC(modelValue);
                        picker.date(moment(adjustedDate));
                    }

                    return adjustedDate
                });

                ngModelController.$parsers.push(function(valueFromInput) {
                    if (!picker.date()) {
                        return null;
                    }
                    var value = adjustDateForLocal(picker.date().valueOf());

                    return value;
                });


                /**
                 * When click occur outside hide the date picker
                 */
                var onDocumentClick = function (event) {
                    var isSelfOrChild = element.find(event.target).length > 0 || element.html() == angular.element(event.target).html();

                    if (!isSelfOrChild) {
                        scope.$apply(picker.hide());
                    }
                };
                $document.on("click", onDocumentClick);

                var offHandle = function () {
                    $document.off("click", onDocumentClick);
                };
                element.on('$destroy', offHandle);



                /**
                 * When input is clicked hide the date picker
                 */
                element.find("input").on('click', function () {
                    picker.hide();
                    element.find("input").focus();
                });

                /**
                 * Enable changing dates by using arrow keys
                 */
                element.on('dp.show', function (e) {
                    picker.keyBinds(defaultKeyBinds);
                });

                /**
                 * Enable movement in input by using arrow keys
                 */
                element.on('dp.hide', function (e) {
                    picker.keyBinds(customKeyBinds);
                });

                element.bind('blur change dp.change dp.hide', function(e) {
                    var millis = null;
                    var date = picker.date();
                    if (date) {
                        millis = adjustDateForLocal(date.valueOf());
                    }

                    ngModelController.$setViewValue(millis);
                    ngModelController.$modelValue = millis;
                    ngModelController.$render();

                    if (!scope.$$phase) {
                        scope.$apply(function () {
                        });
                    }

                });
            }
        };
    }]);

}());
