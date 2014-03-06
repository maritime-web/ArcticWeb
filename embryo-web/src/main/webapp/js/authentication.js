embryo.authentication = {
    currentPageRequiresAuthentication : true
};

embryo.eventbus.AuthenticatedEvent = function() {
    var event = jQuery.Event("AuthenticatedEvent");
    return event;
};

embryo.eventbus.registerShorthand(embryo.eventbus.AuthenticatedEvent, "authenticated");

embryo
        .ready(function() {

            function detectBrowser() {
                if (browser.isIE() && browser.ieVersion() <= 7) {
                    $("#ie7ver").html(browser.ieVersion());
                    $("#ie7").show();
                } else if (browser.isIE() && browser.ieVersion() <= 9) {
                    $("#ie89ver").html(browser.ieVersion());
                    $("#ie89").show();
                }
            }

            function useCookies() {
                if ("true" != getCookie("cookies-accepted")) {
                    $('#cookiesUsage').css("display", "block");
                }
            }

            function rememberUseCookies() {
                $('#cookiesUsage').css("display", "none");
                if ("true" != getCookie("cookies-accepted")) {
                    setCookie("cookies-accepted", "true", 365);
                }
            }

            function clearMessages() {
                $("#ie89").hide();
                $("#ie7").hide();
                $("#loginWrongLoginOrPassword").hide();
            }

            function updateNavigationBar() {
                // is user logged in ?

                if (embryo.authentication.userName == null) {
                    var html = "";

                    html += '<ul  class="nav navtabs">';
                    html += ' <li class="dropdown">';
                    html += '  <a class="dropdown-toggle" data-toggle="dropdown" href="#">About</a>';
                    html += '  <ul style="width:70px;" class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu">';
                    html += '   <li><a tabindex="-1" href="content.html#cookies">Cookies</a></li>';
                    html += '   <li><a tabindex="-1" href="content.html#disclaimer">Disclaimer</a></li>';
                    html += '  </ul>';
                    html += ' </li>';
                    html += '</ul>';
                    html += "<span>";
                    html += "<a href=#login>Log In</a> | <a href=#requestAccess>Request Access</a>"
                    html += "</span>";

                    $("#authentication").html(html);

                    $("#authentication a.dropdown-toggle").click(function(e) {
                        e.preventDefault();
                    });

                    $("#authentication a[href=\"#login\"]").click(function(e) {
                        e.preventDefault();
                        clearMessages();
                        detectBrowser();
                        $("#login").modal("show");
                    });

                    $("#authentication a[href=\"#requestAccess\"]").click(function(e) {
                        e.preventDefault();
                        embryo.authentication.showRequestAccess();
                    });

                    $("#requestAccessBigButton").click(function(e) {
                        e.preventDefault();
                        embryo.authentication.showRequestAccess();
                    });

                } else {
                    var html = "";
                    html += '<ul  class="nav navtabs">';
                    html += ' <li class="dropdown">';
                    html += '  <a class="dropdown-toggle" data-toggle="dropdown" href="#">About</a>';
                    html += '  <ul style="width:70px;" class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu">';
                    html += '   <li><a tabindex="-1" href="content.html#cookies">Cookies</a></li>';
                    html += '   <li><a tabindex="-1" href="content.html#disclaimer">Disclaimer</a></li>';
                    html += '  </ul>';
                    html += ' </li>';
                    html += ' <li class="dropdown">';
                    html += "  <a class='dropdown-toggle' data-toggle='dropdown' href='#'><i class='icon-user icon-white' style='vertical-align:middle; margin-bottom: 4px'></i> ";
                    html += embryo.authentication.userName;
                    html += "  </a>";
                    html += '  <ul style="width:70px;" class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu">';
                    html += '   <li><a tabindex="-1" href="docs/ArcticWeb_user_manual_v1.2.pdf" target="_blank">Manual</a></li>';
                    html += '   <li class="divider"></li>';
                    html += '   <li><a id="logout" tabindex="-1" href="#">Log Out</a></li>';
                    html += '  </ul>';
                    html += ' </li>';
                    html += '</ul>';

                    $("#authentication").html(html);

                    $("#authentication a.dropdown-toggle").click(function(e) {
                        e.preventDefault();
                    });

                    $("#authentication #logout").click(function(e) {
                        e.preventDefault();

                        var messageId = embryo.messagePanel.show({
                            text : "Logging out ..."
                        })

                        $.ajax({
                            url : embryo.baseUrl + "rest/authentication/logout",
                            data : {},
                            success : function(data) {
                                sessionStorage.clear();
                                localStorage.clear();
                                setTimeout(function() {
                                    location = "index.html";
                                }, 100);
                            },
                            error : function(data) {
                                embryo.messagePanel.replace(messageId, {
                                    text : "Logout failed. (" + data.status + ")",
                                    type : "error"
                                })
                            }
                        });
                    });
                }
            }

            $("#login").on("shown", function() {
                useCookies();
                $("#userName").focus();
            });

            $('#login').on('hide', function() {
                $('#cookiesUsage').css("display", "none");
            });

            $("#login button.btn-primary").click(
                    function(e) {
                        e.preventDefault();
                        var messageId = embryo.messagePanel.show({
                            text : "Logging in ..."
                        });

                        rememberUseCookies();
                        $("#login").modal("hide");

                        clearMessages();

                        $.ajax({
                            url : embryo.baseUrl + "rest/authentication/login",
                            data : {
                                userName : $("#userName").val(),
                                password : $("#password").val()
                            },
                            success : function(data) {
                                sessionStorage.clear();

                                if (location.pathname.indexOf("index.html")
                                        && location.pathname.indexOf("content.html") >= 0
                                        || location.pathname.indexOf(".html") < 0) {
                                    location.href = "map.html#/vessel";
                                }
                                embryo.authentication = data;
                                updateNavigationBar();
                                embryo.messagePanel.replace(messageId, {
                                    text : "Succesfully logged in.",
                                    type : "success"
                                });
                                embryo.eventbus.fireEvent(embryo.eventbus.AuthenticatedEvent());
                            },
                            error : function(data) {
                                updateNavigationBar();
                                embryo.messagePanel.replace(messageId, {
                                    text : "Log in failed. (" + data.status + ")",
                                    type : "error"
                                });
                                var errorMessage = embryo.ErrorService.extractError(data, data.status);
                                if (data.status == 401) {
                                    $("#loginWrongLoginOrPassword").css("display", "block");
                                } else {
                                    $("#error").text(errorMessage[0]).css("display", "block");
                                }
                                setTimeout(function() {
                                    $("#login").modal("show");
                                }, 1000);
                            }
                        });

                        $("#userName").val("");
                        $("#password").val("");
                        $("#error").css("display", "none");
                        $("#loginWrongLoginOrPassword").css("display", "none");
                    });

            updateNavigationBar();

            if (embryo.authentication.userName == null) {
                var messageId = embryo.messagePanel.show({
                    text : "Refreshing ..."
                })

                $.ajax({
                    url : embryo.baseUrl + "rest/authentication/details",
                    data : {},
                    success : function(data) {
                        embryo.authentication = data;
                        embryo.messagePanel.replace(messageId, {
                            text : "Refresh succesful.",
                            type : "success"
                        });
                        updateNavigationBar();
                        embryo.eventbus.fireEvent(embryo.eventbus.AuthenticatedEvent());
                    },
                    error : function(data) {
                        if (data.status == 401 && embryo.authentication.currentPageRequiresAuthentication) {
                            embryo.messagePanel.remove(messageId);
                            clearMessages();
                            detectBrowser();
                            $("#login").modal("show");
                        } else {
                            embryo.messagePanel.replace(messageId, {
                                text : "Refresh failed. (" + data.status + ")",
                                type : "error"
                            })
                        }
                    }
                });
            }
        });

(function() {
    "use strict";

    var userModule = angular.module('embryo.UserService', []);

    userModule.factory('UserService', function() {
        return {
            isPermitted : function(permission) {
                var index, permissions = embryo.authentication.permissions;

                for (index in permissions) {
                    if (permissions[index] == permission) {
                        return true;
                    }
                }
                return false;
            }
        };
    });

}());

embryo.ready(function() {
    embryo.authentication.showRequestAccess = function() {
        $("#requestProperSignup input").val("");
        feedback();
        $("#requestProperSignup").modal("show");
        $("#rPreferredLogin").focus();
    }

    function feedback(text) {
        if (text) {
            $("#rFeedback").html(text);
            $("#rFeedback").css("display", "block");
        } else {
            $("#rFeedback").css("display", "none");
        }
    }

    $("#requestProperSignup .btn-primary").click(function(e) {
        e.preventDefault();

        var r = {
            preferredLogin : $("#rPreferredLogin").val(),
            contactPerson : $("#rContactPerson").val(),
            emailAddress : $("#rEmailAddress").val(),
            mmsiNumber : $("#rMmsiNumber").val()
        }

        if (r.mmsiNumber) {
            var x = r.mmsiNumber;
            r.mmsiNumber = parseInt(x);
            if (r.mmsiNumber != x) {
                feedback("MMSI must be only digits.");
                return;
            }
        }

        if (!r.emailAddress) {
            feedback("A proper email address is required.");
        } else {
            feedback("Sending request for access.")

            $.ajax({
                url : embryo.baseUrl + "rest/request-access/save",
                method : "POST",
                contentType : "application/json; charset=utf-8",
                data : JSON.stringify(r),
                success : function() {
                    feedback("Request for access has been sent. We will get back to you via email.")
                },
                error : function() {
                    feedback("Request for access has failed. Please try again.")
                }
            })
        }

    })

});

(function() {
    "use strict";
    var module = angular.module('embryo.authentication', []);

    module.directive('passwordMatch', [ function() {
        return {
            restrict : 'A',
            scope : true,
            require : 'ngModel',
            link : function(scope, elem, attrs, control) {
                var checker = function() {
                    // get the value of the first password
                    var e1 = scope.$eval(attrs.ngModel);

                    // get the value of the other password
                    var e2 = scope.$eval(attrs.passwordMatch);
                    return e1 == e2;
                };
                scope.$watch(checker, function(n) {
                    // set the form control to valid if both
                    // passwords are the same, else invalid
                    control.$setValidity("passwordMatch", n);
                });
            }
        };
    } ]);

}());
