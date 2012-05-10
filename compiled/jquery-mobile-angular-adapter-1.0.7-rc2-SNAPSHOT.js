/**
* jQuery Mobile angularJS adaper v1.0.7-rc2-SNAPSHOT
* http://github.com/tigbro/jquery-mobile-angular-adapter
*
* Copyright 2011, Tobias Bosch (OPITZ CONSULTING GmbH)
* Licensed under the MIT license.
*/
(function($) {
    // selectmenu may create parent element and extra pages
    var fn = $.mobile.selectmenu.prototype;
    var oldDestroy = fn.destroy;
    fn.destroy = function () {
        // Destroy the widget instance first to prevent
        // a stack overflow.
        var parent = this.element.closest(".ui-select");
        var menuPage = this.menuPage;
        var screen = this.screen;
        var listbox = this.listbox;
        oldDestroy.apply(this, arguments);
        parent && parent.remove();
        menuPage && menuPage.remove();
        screen && screen.remove();
        listbox && listbox.remove();
    };

    // Button wraps the actual button into another div that is stored in the
    // "button" property.
    var fn = $.mobile.button.prototype;
    var oldDestroy = fn.destroy;
    fn.destroy = function() {
        // Destroy the widget instance first to prevent
        // a stack overflow.
        oldDestroy.apply(this, arguments);
        this.button.remove();
    };

    // Listview may create subpages that need to be removed when the widget is destroyed.
    var fn = $.mobile.listview.prototype;
    var oldDestroy = fn.destroy;
    fn.destroy = function() {
        // Destroy the widget instance first to prevent
        // a stack overflow.
        // Note: If there are more than 1 listview on the page, childPages will return
        // the child pages of all listviews.
        var id = this.element.attr('id');
        var childPageRegex = new RegExp($.mobile.subPageUrlKey + "=" +id+"-");
        var childPages = this.childPages();
        oldDestroy.apply(this, arguments);
        for (var i=0; i<childPages.length; i++) {
            var childPage = $(childPages[i]);
            var dataUrl = childPage.attr('data-url');
            if (dataUrl.match(childPageRegex)) {
                childPage.remove();
            }
        }
    };

    // Slider appends a new element after the input/select element for which it was created.
    // The angular compiler does not like this, so we wrap the two elements into a new parent node.
    var fn = $.mobile.slider.prototype;
    var oldCreate = fn._create;
    fn._create = function() {
        var res = oldCreate.apply(this, arguments);
        // var list = $().add(this.element).add(this.slider);
        var parent = this.element[0].parentNode;
        var div = document.createElement("div");
        parent.insertBefore(div, this.element[0]);
        div.appendChild(this.element[0]);
        div.appendChild(this.slider[0]);
        this.wrapper = $(div);
        return res;
    };

    var oldDestroy = fn.destroy;
    fn.destroy = function() {
        // Destroy the parent node that we created in _create.
        oldDestroy.apply(this, arguments);
        this.wrapper.remove();
    };
})(window.jQuery);
(function (angular) {

    var ng = angular.module('ng');
    ng.config(['$provide', function($provide) {
        $provide.decorator('$rootScope', ['$delegate', function($rootScope) {
            $rootScope.$disconnect = function() {
                if (this.$root == this) return; // we can't disconnect the root node;
                var parent = this.$parent;
                this.$$disconnected = true;
                // See Scope.$destroy
                if (parent.$$childHead == this) parent.$$childHead = this.$$nextSibling;
                if (parent.$$childTail == this) parent.$$childTail = this.$$prevSibling;
                if (this.$$prevSibling) this.$$prevSibling.$$nextSibling = this.$$nextSibling;
                if (this.$$nextSibling) this.$$nextSibling.$$prevSibling = this.$$prevSibling;
                this.$$nextSibling = this.$$prevSibling = null;
            };
            $rootScope.$reconnect = function() {
                if (this.$root == this) return; // we can't disconnect the root node;
                var child = this;
                if (!child.$$disconnected) {
                    return;
                }
                var parent = child.$parent;
                child.$$disconnected = false;
                // See Scope.$new for this logic...
                child.$$prevSibling = parent.$$childTail;
                if (parent.$$childHead) {
                    parent.$$childTail.$$nextSibling = child;
                    parent.$$childTail = child;
                } else {
                    parent.$$childHead = parent.$$childTail = child;
                }

            };
            return $rootScope;
        }]);
    }]);
})(window.angular);
(function (angular) {
    var ng = angular.module('ng');
    ng.config(['$provide', function ($provide) {
        $provide.decorator('$rootScope', ['$delegate', function ($rootScope) {
            var _apply = $rootScope.$apply;
            $rootScope.$apply = function () {
                if ($rootScope.$$phase) {
                    return $rootScope.$eval.apply(this, arguments);
                }
                return _apply.apply(this, arguments);
            };
            var refreshing = false;
            var _digest = $rootScope.$digest;
            $rootScope.$digest = function () {
                if ($rootScope.$$phase) {
                    return;
                }
                var res = _digest.apply(this, arguments);
            };
            return $rootScope;
        }]);
    }]);
})(window.angular);
(function ($, angular) {
    // Only digest the $.mobile.activePage when rootScope.$digest is called.
    var ng = angular.module('ng');
    $('div').live('pagebeforeshow', function (event, data) {
        var page = $(event.target);
        var currPageScope = page.scope();
        if (currPageScope) {
            currPageScope.$root.$digest();
        }
    });

    ng.config(['$provide', function ($provide) {
        $provide.decorator('$rootScope', ['$delegate', function ($rootScope) {
            var _$digest = $rootScope.$digest;
            var lastActiveScope;
            $rootScope.$digest = function () {
                if (this === $rootScope) {
                    var p = $.mobile.activePage;
                    var activeScope = p && p.scope();
                    if (lastActiveScope && lastActiveScope !== activeScope) {
                        lastActiveScope.$disconnect();
                    }
                    lastActiveScope = activeScope;
                    if (activeScope) {
                        activeScope.$reconnect();
                    }
                }
                return _$digest.apply(this, arguments);
            };
            return $rootScope;
        }]);
    }]);

    $.mobile.autoInitializePage = false;
    var jqmInitialized = false;

    // We want to create a special directive that matches data-role="page" and data-role="dialog",
    // but none of the other data-role="..." elements of jquery mobile. As we want to create a new
    // scope for those elements (but not for the others), this is only possible, if we preprocess the dom and add a new attribute
    // that is unique for pages and dialogs, for which we can register an angular directive.
    ng.config(['$provide', function ($provide) {
        $provide.decorator('$compile', ['$delegate', function ($delegate) {
            var selector = ':jqmData(role="page"), :jqmData(role="dialog")';
            var rolePageAttr = 'jqm-page';
            return function (element) {
                var parentPage = element.parents(selector);
                if (parentPage.length > 0) {
                    // within a parent page: enhance non-widgets markup.
                    var old = preventJqmWidgetCreation;
                    preventJqmWidgetCreation = true;
                    element.parent().trigger("create");
                    preventJqmWidgetCreation = old;
                } else {
                    element.filter(selector).add(element.find(selector)).attr(rolePageAttr, true);
                }
                return $delegate.apply(this, arguments);
            }
        }]);
    }]);

    var preventJqmWidgetCreation = false;

    // Directive for jquery mobile pages. Refreshes the jquery mobile widgets
    // when the page changes.
    ng.directive('jqmPage', ['$compile', function ($compile) {
        return {
            restrict:'A',
            scope:true,
            compile:function(tElement, tAttrs) {
                var old = preventJqmWidgetCreation;
                preventJqmWidgetCreation = true;
                if (!jqmInitialized) {
                    jqmInitialized = true;
                    $.mobile.initializePage();
                }
                tElement.page();
                preventJqmWidgetCreation = old;
                return {
                    pre:function preLink(scope, iElement, iAttrs) {
                        // Detach the scope from the normal $digest cycle.
                        // Needed so that only $.mobile.activePage gets digested when rootScope.$digest
                        // is called.
                        scope.$disconnect();
                    }
                }
            }
        };
    }]);

    $.fn.orig = {};

    function patchJq(fnName, callback) {
        $.fn.orig[fnName] = $.fn.orig[fnName] || $.fn[fnName];
        $.fn[fnName] = callback;
    }

    // If jqm loads a page from an external source, angular needs to compile it too!
    ng.run(['$rootScope', '$compile', function ($rootScope, $compile) {
        patchJq('page', function () {
            if (!preventJqmWidgetCreation) {
                if (this.attr("data-" + $.mobile.ns + "external-page")) {
                    $compile(this)($rootScope.$new());
                }
            }
            return $.fn.orig.page.apply(this, arguments);
        });
    }]);

    function deactivateJqmWidgetEnhanceDuringPageCompile(widgetName) {
        patchJq(widgetName, function() {
            if (preventJqmWidgetCreation) {
                return false;
            }
            return $.fn.orig[widgetName].apply(this, arguments);
        });
    }

    ng.config(["$compileProvider", function ($compileProvider) {
        var jqmNgBindings = {};

        var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;

        /**
         * Converts snake_case to camelCase.
         * Also there is special case for Moz prefix starting with upper case letter.
         * @param name Name to normalize
         */
        function normalizeDirectiveName(name) {
            if (name.indexOf('data-') === 0) {
                name = name.substring(5);
            }
            // camelCase
            return name.
                replace(SPECIAL_CHARS_REGEXP, function (_, separator, letter, offset) {
                return offset ? letter.toUpperCase() : letter;
            });
        }

        function bindJqmWidgetToAngularWidget(jqmWidgetName, directiveName, directiveType, filter, linkfn) {
            var bindings = jqmNgBindings[directiveName];
            if (!bindings) {
                bindings = [];
                jqmNgBindings[directiveName] = bindings;
                $compileProvider.directive(normalizeDirectiveName(directiveName), function () {
                    return {
                        restrict:directiveType,
                        require:['?ngModel'],
                        compile:function () {
                            return {
                                post:function (scope, iElement, iAttrs, ctrls) {
                                    for (var i = 0; i < bindings.length; i++) {
                                        var localJqmWidgetName = bindings[i].widgetName;
                                        if (!iElement.data(localJqmWidgetName)) {
                                            var localFilter = bindings[i].filter;
                                            if (!localFilter || iElement.filter(localFilter).length > 0) {
                                                iElement[localJqmWidgetName]();
                                                if (bindings[i].link) {
                                                    bindings[i].link.apply(this, arguments);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            }
            bindings.push({widgetName:jqmWidgetName, filter:filter, link:linkfn});

            deactivateJqmWidgetEnhanceDuringPageCompile(jqmWidgetName);
        }

        // Supported Syntax:
        // button
        // input[type="name"]
        // :jqmData(type='search') -> Replace with [data-type="search"]
        // [type='button']
        var jqmDataRE = /:jqmData\(([^)]*)\)/g;

        function getSelectorParts(selector) {
            var parts = selector.split(',');
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];
                part = $.trim(part);
                // see jquery mobile
                parts[i] = part.replace(jqmDataRE, "[data-" + ( $.mobile.ns || "" ) + "$1]");
            }
            return parts;
        }

        var selectorRegex = /(\[)?([A-Za-z0-9\-]+)(.*)/;

        /**
         * Registers a jqm widget at the angular compiler, so that angular creates the right widget at the right place.
         * For this, this function will parse the jqm selectors and create the needed angular widgets.
         * <p>
         * Only use this for "real" jqm widgets, i.e. widgets that are not only markup, and also contain listeners.
         * @param widgetName
         * @param selector The jquery selector to register the widget with.
         * @param linkFn An additional angular linking function (optional)
         */
        function registerJqmWidget(widgetName, selector, linkFn) {
            var selectorParts = getSelectorParts(selector);
            for (var i = 0; i < selectorParts.length; i++) {
                var part = selectorParts[i];
                var match = selectorRegex.exec(part);
                if (!match) {
                    throw new Error("Could not parse the selector " + part);
                }
                var attrDirective = match[1];
                var directiveName = match[2];
                if (attrDirective) {
                    bindJqmWidgetToAngularWidget(widgetName, directiveName, 'A', part, linkFn);
                } else {
                    var filter = match[3];
                    bindJqmWidgetToAngularWidget(widgetName, directiveName, 'E', filter, linkFn);
                }
            }
        }

        $compileProvider.registerJqmWidget = registerJqmWidget;
    }]);
})(window.jQuery, window.angular);
(function (angular) {
    var widgetConfig = {
        button:{
            selector:true,
            handlers:[disabledHandler]
        },
        collapsible:{
            selector:true,
            handlers:[disabledHandler]
        },
        textinput:{
            selector:true,
            handlers:[disabledHandler]
        },
        checkboxradio:{
            selector:true,
            handlers:[disabledHandler, refreshOnNgModelRender]
        },
        slider:{
            selector:true,
            handlers:[disabledHandler, refreshOnNgModelRender]
        },
        listview:{
            selector:true,
            handlers:[refreshOnChildrenChange]
        },
        collapsibleset:{
            selector:true,
            handlers:[refreshOnChildrenChange]
        },
        selectmenu:{
            selector:true,
            handlers:[disabledHandler, refreshOnNgModelRender, refreshOnChildrenChange]
        },
        controlgroup:{
            selector:":jqmData(role='controlgroup')",
            handlers:[refreshOnChildrenChange]
        }
    };

    var ng = angular.module("ng");
    ng.config(["$compileProvider", function ($compileProvider) {
        var config, selector;
        for (var widgetName in widgetConfig) {
            config = widgetConfig[widgetName];
            if (config.selector === true) {
                selector = getJqmWidgetSelector(widgetName);
            } else {
                selector = config.selector;
            }
            $compileProvider.registerJqmWidget(widgetName, selector, mergeHandlers(widgetName, config.handlers));
        }
    }]);

    function getJqmWidgetSelector(widgetName) {
        return $.mobile[widgetName].prototype.options.initSelector;
    }

    function mergeHandlers(widgetName, handlers) {
        return function (scope, iElement, iAttrs, ctrls) {
            for (var i = 0; i < handlers.length; i++) {
                handlers[i](widgetName, scope, iElement, iAttrs, ctrls);
            }
        }
    }

    function disabledHandler(widgetName, scope, iElement, iAttrs, ctrls) {
        iAttrs.$observe("disabled", function (value) {
            if (value) {
                iElement[widgetName]("disable");
            } else {
                iElement[widgetName]("enable");
            }
        });
    }

    function addCtrlFunctionListener(ctrl, ctrlFnName, fn) {
        var listenersName = "_listeners" + ctrlFnName;
        if (!ctrl[listenersName]) {
            ctrl[listenersName] = [];
            var oldFn = ctrl[ctrlFnName];
            ctrl[ctrlFnName] = function () {
                var res = oldFn.apply(this, arguments);
                for (var i = 0; i < ctrl[listenersName].length; i++) {
                    ctrl[listenersName][i]();
                }
                return res;
            };
        }
        ctrl[listenersName].push(fn);
    }

    function refreshOnNgModelRender(widgetName, scope, iElement, iAttrs, ctrls) {
        var ngModelCtrl = ctrls[0];
        if (ngModelCtrl) {
            addCtrlFunctionListener(ngModelCtrl, "$render", function () {
                triggerAsyncRefresh(widgetName, scope, iElement);
            });
        }
    }

    function refreshOnChildrenChange(widgetName, scope, iElement, iAttrs, ctrls) {
        scope.$on("$childrenChanged", function () {
            triggerAsyncRefresh(widgetName, scope, iElement);
        });
    }

    function triggerAsyncRefresh(widgetName, scope, iElement, iAttrs, ctrls) {
        var prop = "_refresh" + widgetName;
        scope[prop] = scope[prop] + 1 || 1;
        scope.$evalAsync(function () {
            scope[prop]--;
            if (scope[prop] === 0) {
                iElement[widgetName]("refresh");
            }
        });
    }


})(window.angular);
(function (angular) {
    /**
     * Deactivate the url changing capabilities
     * of angular, so we do not get into trouble with
     * jquery mobile: angular saves the current url before a $digest
     * and updates the url after the $digest.
     * <p>
     * This also replaces the hashListen implementation
     * of angular by the jquery mobile impementation,
     * so we do not have two polling functions, ...
     * <p>
     * Attention: By this, urls can no more be changed via angular's $location service!
     */

    var ng = angular.module("ng");

    function deactivateAngularLocationService($browser) {
        $browser.onHashChange = function (handler) {
            $(window).bind('hashchange', handler);
            return handler;
        };
        var lastUrl = location.href;
        $browser.url = function (url) {
            if (url) {
                lastUrl = url;
            }
            return lastUrl;
        };
    }

    deactivateAngularLocationService.$inject = ['$browser'];
    ng.run(deactivateAngularLocationService);
})(window.angular);
(function ($, angular) {
    /**
     * Modify the original repeat: Make sure that all elements are added under the same parent.
     * This is important, as some jquery mobile widgets wrap the elements into new elements,
     * and angular just uses element.after().
     * See angular issue 831
     */
    function instrumentNodeForNgRepeat(scope, parent, node, fnName) {
        var _old = node[fnName];
        node[fnName] = function (otherNode) {
            var target = this;
            while (target.parent()[0] !== parent) {
                target = target.parent();
                if (target.length === 0) {
                    throw new Error("Could not find the expected parent in the node path", this, parent);
                }
            }
            instrumentNodeForNgRepeat(scope, parent, otherNode, fnName);
            var res = _old.call(target, otherNode);
            return res;
        };
    }

    function shallowEquals(collection1, collection2) {
        if (!!collection1 ^ !!collection2) {
            return false;
        }
        for (var x in collection1) {
            if (collection2[x] !== collection1[x]) {
                return false;
            }
        }
        for (var x in collection2) {
            if (collection2[x] !== collection1[x]) {
                return false;
            }
        }
        return true;
    }

    function shallowClone(collection) {
        if (!collection) {
            return collection;
        }
        var res;
        if (collection.length) {
            res = [];
        } else {
            res = {};
        }
        for (var x in collection) {
            res[x] = collection[x];
        }
        return res;
    }

    var mod = angular.module('ng');
    mod.directive('ngRepeat', function () {
        return {
            priority:1000, // same as original repeat
            compile:function (element, attr, linker) {
                return {
                    pre:function (scope, iterStartElement, attr) {
                        instrumentNodeForNgRepeat(scope, iterStartElement.parent()[0], iterStartElement, 'after');
                        var expression = attr.ngRepeat;
                        var match = expression.match(/^.+in\s+(.*)\s*$/);
                        if (!match) {
                            throw Error("Expected ngRepeat in form of '_item_ in _collection_' but got '" +
                                expression + "'.");
                        }
                        var collectionExpr = match[1];
                        var lastCollection;
                        var changeCounter = 0;
                        scope.$watch(function () {
                            var collection = scope.$eval(collectionExpr);
                            if (!shallowEquals(collection, lastCollection)) {
                                lastCollection = shallowClone(collection);
                                changeCounter++;
                            }
                            return changeCounter;
                        }, function () {
                            scope.$emit("$childrenChanged");
                        });
                    }
                };
            }
        };
    });
})(window.jQuery, window.angular);
(function ($, angular) {
    // This is a copy of parts of angular's ngOptions directive to detect changes in the values
    // of ngOptions (emits the $childrenChanged event on the scope).
    // This is needed as ngOptions does not provide a way to listen to changes.

    function sortedKeys(obj) {
        var keys = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys.sort();
    }

    var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w\d]*)|(?:\(\s*([\$\w][\$\w\d]*)\s*,\s*([\$\w][\$\w\d]*)\s*\)))\s+in\s+(.*)$/;
    var mod = angular.module('ng');
    mod.directive('ngOptions', ['$parse', function ($parse) {
        return {
            require: ['select', '?ngModel'],
            link:function (scope, element, attr, ctrls) {
                // if ngModel is not defined, we don't need to do anything
                if (!ctrls[1]) return;

                var match;
                var optionsExp = attr.ngOptions;

                if (! (match = optionsExp.match(NG_OPTIONS_REGEXP))) {
                    throw Error(
                        "Expected ngOptions in form of '_select_ (as _label_)? for (_key_,)?_value_ in _collection_'" +
                            " but got '" + optionsExp + "'.");
                }

                var displayFn = $parse(match[2] || match[1]),
                    valueName = match[4] || match[6],
                    keyName = match[5],
                    groupByFn = $parse(match[3] || ''),
                    valueFn = $parse(match[2] ? match[1] : valueName),
                    valuesFn = $parse(match[7]);

                scope.$watch(optionsModel, function() {
                    scope.$emit("$childrenChanged");
                }, true);

                function optionsModel() {
                    var optionGroups = [], // Temporary location for the option groups before we render them
                        optionGroupName,
                        values = valuesFn(scope) || [],
                        keys = keyName ? sortedKeys(values) : values,
                        length,
                        index,
                        locals = {};

                    // We now build up the list of options we need (we merge later)
                    for (index = 0; length = keys.length, index < length; index++) {
                        var value = values[index];
                        locals[valueName] = values[keyName ? locals[keyName]=keys[index]:index];
                        optionGroupName = groupByFn(scope, locals);
                        optionGroups.push({
                            id: keyName ? keys[index] : index,   // either the index into array or key from object
                            label: displayFn(scope, locals), // what will be seen by the user
                            optionGroup: optionGroupName
                        });
                    }
                    return optionGroups;
                }
            }
        };
    }]);


})(window.jQuery, window.angular);
(function (angular) {
    var ng = angular.module("ng");
    ng.directive('option', ['$interpolate', function ($interpolate) {
        return {
            restrict:'E',
            compile:function (tElement, tAttrs) {
                var textInterpolateFn = $interpolate(tElement.text(), true);
                var valueInterpolateFn = $interpolate(tElement.attr('value'), true);
                return function (scope, iElement, iAttrs) {
                    scope.$watch(textInterpolateFn, function () {
                        scope.$emit("$childrenChanged");
                    });
                    scope.$watch(valueInterpolateFn, function () {
                        scope.$emit("$childrenChanged");
                    });
                }
            }
        };
    }]);
})(window.angular);
(function (angular) {
    var ng = angular.module("ng");
    ng.directive("ngSwitch",
        function () {
            return {
                restrict:'EA',
                compile:function (element, attr) {
                    var watchExpr = attr.ngSwitch || attr.on;
                    return function (scope, element) {
                        scope.$watch(watchExpr, function (value) {
                            scope.$emit("$childrenChanged");
                        });
                    }
                }
            }
        });
})(window.angular);
(function (angular) {
    var ng = angular.module("ng");
    ng.directive("ngInclude",
        function () {
            return {
                restrict:'ECA',
                compile:function (element, attr) {
                    var srcExp = attr.ngInclude || attr.src;
                    return function (scope, element) {
                        scope.$watch(srcExp, function (src) {
                            scope.$emit("$childrenChanged");
                        });
                        scope.$on("$includeContentLoaded", function() {
                            scope.$emit("$childrenChanged");
                        });
                    }
                }
            }
        });
})(window.angular);
(function ($, angular) {
    var mod = angular.module('ng');
    mod.directive("input", function () {
        return {
            restrict:'E',
            require:'?ngModel',
            compile:function (tElement, tAttrs) {
                var type = tElement.attr('type');
                return {
                    pre:function (scope, iElement, iAttrs, ctrl) {
                        if (!ctrl) {
                            return;
                        }
                        var listenToEvents = [];
                        if (type === 'date') {
                            // Angular binds to the input or keydown+change event.
                            // However, date inputs on IOS5 do not fire any of those (only the blur event).
                            // See ios5 bug TODO
                            listenToEvents.push("blur");
                        }
                        // always bind to the change event, if angular would only listen to the "input" event.
                        // Needed as jqm often fires change events when the input widgets change...
                        listenToEvents.push("change");

                        var _bind = iElement.bind;
                        iElement.bind = function (events, callback) {
                            if (events.indexOf('input') != -1 || events.indexOf('change') != -1) {
                                for (var i=0; i<listenToEvents.length; i++) {
                                    var event = listenToEvents[i];
                                    if (events.indexOf(event)===-1) {
                                        events+=" "+event;
                                    }
                                }
                            }
                            return _bind.call(this, events, callback);
                        };
                    }
                }
            }
        };

    });
})(window.jQuery, window.angular);


(function (angular) {
    /*
     * Defines the ng:if tag. This is useful if jquery mobile does not allow
     * an ng-switch element in the dom, e.g. between ul and li.
     */
    var ngIfDirective = {
        transclude:'element',
        priority:1000,
        terminal:true,
        compile:function (element, attr, linker) {
            return function (scope, iterStartElement, attr) {
                var expression = attr.ngmIf;

                var lastElement;
                var lastScope;
                scope.$watch(expression, function (newValue) {
                    if (newValue) {
                        lastScope = scope.$new();
                        linker(lastScope, function (clone) {
                            lastElement = clone;
                            iterStartElement.after(clone);
                        });
                    } else {
                        lastElement && lastElement.remove();
                        lastScope && lastScope.$destroy();
                    }
                    scope.$emit("$childrenChanged");
                });
            };
        }
    };
    var ng = angular.module('ng');
    ng.directive('ngmIf', function () {
        return ngIfDirective;
    });
})(window.angular);

(function (angular) {
    var mod = angular.module('ng');

    /**
     * A widget to bind general events like touches, ....
     */
    mod.directive("ngmEvent", function () {
        return {
            compile:function (element, attrs) {
                var eventHandlers = angular.fromJson(attrs.ngmEvent);
                return function (scope, element, attrs) {
                    for (var eventType in eventHandlers) {
                        registerEventHandler(scope, element, eventType, eventHandlers[eventType]);
                    }
                }
            }
        }
    });

    function registerEventHandler(scope, element, eventType, handler) {
        element.bind(eventType, function (event) {
            var res = scope.$apply(handler, element);
            if (eventType.charAt(0) == 'v') {
                // This is required to prevent a second
                // click event, see
                // https://github.com/jquery/jquery-mobile/issues/1787
                event.preventDefault();
            }
        });
    }

    function createEventDirective(directive, eventType) {
        mod.directive(directive, function () {
            return function (scope, element,attrs) {
                var eventHandler = attrs[directive];
                registerEventHandler(scope, element, eventType, eventHandler);
            };
        });
    }

    var eventDirectives = {ngmTaphold:'taphold', ngmSwipe:'swipe', ngmSwiperight:'swiperight',
        ngmSwipeleft:'swipeleft',
        ngmPagebeforeshow:'pagebeforeshow',
        ngmPagebeforehide:'pagebeforehide',
        ngmPageshow:'pageshow',
        ngmPagehide:'pagehide',
        ngmClick:'vclick'
    };
    for (var directive in eventDirectives) {
        createEventDirective(directive, eventDirectives[directive])
    }

})(window.angular);
(function($, angular) {
    function splitAtFirstColon(value) {
        var pos = value.indexOf(':');
        if (pos===-1) {
            return [value];
        }
        return [
            value.substring(0, pos),
            value.substring(pos+1)
        ];
    }

    function callActivateFnOnPageChange(fnName, params) {
        if (fnName) {
            $(document).one("pagebeforechange", function(event, data) {
                var toPageUrl = $.mobile.path.parseUrl( data.toPage );
                var page = $("#"+toPageUrl.hash.substring(1));
                function executeCall() {
                    var scope = page.scope();
                    scope[fnName].apply(scope, params);
                }
                if (!page.data("page")) {
                    page.one("pagecreate", executeCall);
                    return;
                }
                executeCall();
            });
        }
    }

    /*
     * Service for page navigation.
     * @param target has the syntax: [<transition>:]pageId
     * @param activateFunctionName Function to call in the target scope.
     * @param further params Parameters for the function that should be called in the target scope.
     */
    function navigate(target, activateFunctionName) {
        var activateParams = Array.prototype.slice.call(arguments, 2);
        var navigateOptions, pageId;
        callActivateFnOnPageChange(activateFunctionName, activateParams);
        if (typeof target === 'object') {
            navigateOptions = target;
            pageId = navigateOptions.target;
        } else {
            var parts = splitAtFirstColon(target);
            if (parts.length === 2 && parts[0] === 'back') {
                var pageId = parts[1];
                var relativeIndex = getIndexInStack(pageId);
                if (relativeIndex === undefined) {
                    pageId = jqmChangePage(pageId, {reverse: true});
                } else {
                    window.history.go(relativeIndex);
                }
                return;
            } else if (parts.length === 2) {
                navigateOptions = { transition: parts[0] };
                pageId = parts[1];
            } else {
                pageId = parts[0];
                navigateOptions = undefined;
            }
        }
        if (pageId === 'back') {
            window.history.go(-1);
        } else {
            jqmChangePage(pageId, navigateOptions);
        }
    }

    function jqmChangePage(pageId, navigateOptions) {
        var callArgs = [pageId];
        if (navigateOptions) {
            callArgs.push(navigateOptions);
        }
        $.mobile.changePage.apply($.mobile, callArgs);
        return pageId;
    }


    var mod = angular.module('ng');
    mod.factory('$navigate', function() {
        return navigate;
    });

    function getIndexInStack(pageId) {
        var stack = $.mobile.urlHistory.stack;
        var res = 0;
        var pageUrl;
        for (var i = stack.length - 2; i >= 0; i--) {
            pageUrl = stack[i].pageUrl;
            if (pageUrl === pageId) {
                return i - stack.length + 1;
            }
        }
        return undefined;
    }

    return navigate;

})(window.jQuery, window.angular);
(function(angular) {
    var storageName = '$$sharedControllers';

    function storage(rootScope) {
        return rootScope[storageName] = rootScope[storageName] || {};
    }

    function sharedCtrl(rootScope, controllerName, $controller, usedInPage) {
        var store = storage(rootScope);
        var scopeInstance = store[controllerName];
        if (!scopeInstance) {
            scopeInstance = rootScope.$new();
            $controller(controllerName, {$scope: scopeInstance});
            store[controllerName] = scopeInstance;
            scopeInstance.$$referenceCount = 0;
        }
        scopeInstance.$$referenceCount++;
        usedInPage.bind("$destroy", function() {
            scopeInstance.$$referenceCount--;
            if (scopeInstance.$$referenceCount===0) {
                scopeInstance.$destroy();
                delete store[controllerName];
            }
        });
        return scopeInstance;
    }

    function parseSharedControllersExpression(expression) {
        var pattern = /([^\s,:]+)\s*:\s*([^\s,:]+)/g;
        var match;
        var hasData = false;
        var controllers = {};
        while (match = pattern.exec(expression)) {
            hasData = true;
            controllers[match[1]] = match[2];
        }
        if (!hasData) {
            throw "Expression " + expression + " needs to have the syntax <name>:<controller>,...";
        }
        return controllers;
    }

    var mod = angular.module('ng');
    mod.directive('ngmSharedController', ['$controller', function($controller) {
        return {
            scope: true,
            compile: function(element, attrs) {
                var expression = attrs.ngmSharedController;
                var controllers = parseSharedControllersExpression(expression);
                var preLink = function(scope) {
                    for (var name in controllers) {
                        scope[name] = sharedCtrl(scope.$root, controllers[name], $controller, element);
                    }
                };
                return {
                    pre: preLink
                }
            }
        };
    }]);
})(window.angular);
(function($, angular) {
    var showCalls = [];

    function onClick(event) {
        var lastCall = showCalls[showCalls.length - 1];
        if (lastCall.callback) {
            rootScope.$apply(function() {
                lastCall.callback.apply(this, arguments);
            });
        }
        // This is required to prevent a second
        // click event, see
        // https://github.com/jquery/jquery-mobile/issues/1787
        event.preventDefault();
    }

    var loadDialog;

    function initIfNeeded() {
        if (!loadDialog || loadDialog.length == 0) {
            loadDialog = $(".ui-loader");
            loadDialog.bind('vclick', onClick);
        }
    }

    if (!$.mobile.loadingMessageWithCancel) {
        $.mobile.loadingMessageWithCancel = 'Loading. Click to cancel.';
    }

    function updateUi() {
        initIfNeeded();
        if (showCalls.length > 0) {
            var lastCall = showCalls[showCalls.length - 1];
            var msg = lastCall.msg;
            var oldMessage = $.mobile.loadingMessage;
            var oldTextVisible = $.mobile.loadingMessageTextVisible;
            if (msg) {
                $.mobile.loadingMessage = msg;
                $.mobile.loadingMessageTextVisible = true;
            }
            $.mobile.showPageLoadingMsg();
            $.mobile.loadingMessageTextVisible = oldTextVisible;
            $.mobile.loadingMessage = oldMessage;
        } else {
            $.mobile.hidePageLoadingMsg();
        }
    }

    /**
     * jquery mobile hides the wait dialog when pages are transitioned.
     * This immediately closes wait dialogs that are opened in the pagebeforeshow event.
     */
    $('div').live('pageshow', function(event, ui) {
        updateUi();
    });

    /**
     *
     * @param msg (optional)
     * @param tapCallback (optional)
     */
    function show() {
        var msg, tapCallback;
        if (typeof arguments[0] == 'string') {
            msg = arguments[0];
        }
        if (typeof arguments[0] == 'function') {
            tapCallback = arguments[0];
        }
        if (typeof arguments[1] == 'function') {
            tapCallback = arguments[1];
        }

        showCalls.push({msg: msg, callback: tapCallback});
        updateUi();
    }

    function hide() {
        showCalls.pop();
        updateUi();
    }

    function always(promise, callback) {
        promise.then(callback, callback);
    }

    /**
     *
     * @param promise
     * @param msg (optional)
     */
    function waitFor(promise, msg) {
        show(msg);
        always(promise, function() {
            hide();
        });
    }

    /**
     *
     * @param deferred
     * @param cancelData
     * @param msg (optional)
     */
    function waitForWithCancel(deferred, cancelData, msg) {
        if (!msg) {
            msg = $.mobile.loadingMessageWithCancel;
        }
        show(msg, function() {
            deferred.reject(cancelData);
        });
        always(deferred.promise, function() {
            hide();
        });
    }

    var res = {
        show: show,
        hide: hide,
        waitFor: waitFor,
        waitForWithCancel:waitForWithCancel
    };

    var mod = angular.module('ng');
    var rootScope;
    mod.factory('$waitDialog', ['$rootScope', function($rootScope) {
        rootScope = $rootScope;
        return res;
    }]);

    return res;
})(window.jQuery, window.angular);
(function ($, angular) {

    function pagedListFilterFactory(defaultListPageSize, filterFilter, orderByFilter) {

        function createPagedList(list) {
            var enhanceFunctions = {
                refreshIfNeeded:refreshIfNeeded,
                setFilter:setFilter,
                setOrderBy:setOrderBy,
                setPageSize:setPageSize,
                loadNextPage:loadNextPage,
                hasMorePages:hasMorePages,
                reset:reset,
                refreshCount:0
            };

            var pagedList = [];
            var pageSize, originalList, originalListClone, refreshNeeded, filter, orderBy, loadedCount, availableCount;

            for (var fnName in enhanceFunctions) {
                pagedList[fnName] = enhanceFunctions[fnName];
            }
            init(list);
            var oldHasOwnProperty = pagedList.hasOwnProperty;
            pagedList.hasOwnProperty = function (propName) {
                if (propName in enhanceFunctions) {
                    return false;
                }
                return oldHasOwnProperty.apply(this, arguments);
            };
            return pagedList;

            function init(list) {
                setPageSize(-1);
                originalList = list;
                originalListClone = [];
                refreshNeeded = true;
                reset();
            }

            function refresh() {
                var list = originalList;
                originalListClone = [].concat(list);
                if (filter) {
                    list = filterFilter(list, filter);
                }
                if (orderBy) {
                    list = orderByFilter(list, orderBy);
                }
                if (loadedCount < pageSize) {
                    loadedCount = pageSize;
                }
                if (loadedCount > list.length) {
                    loadedCount = list.length;
                }
                availableCount = list.length;
                var newData = list.slice(0, loadedCount);
                var spliceArgs = [0, pagedList.length].concat(newData);
                pagedList.splice.apply(pagedList, spliceArgs);
                pagedList.refreshCount++;
            }

            function refreshIfNeeded() {
                if (originalList.length != originalListClone.length) {
                    refreshNeeded = true;
                } else {
                    for (var i = 0; i < originalList.length; i++) {
                        if (originalList[i] !== originalListClone[i]) {
                            refreshNeeded = true;
                            break;
                        }
                    }
                }
                if (refreshNeeded) {
                    refresh();
                    refreshNeeded = false;
                }
                return pagedList;
            }

            function setPageSize(newPageSize) {
                if (!newPageSize || newPageSize < 0) {
                    newPageSize = defaultListPageSize;
                }
                if (newPageSize !== pageSize) {
                    pageSize = newPageSize;
                    refreshNeeded = true;
                }
            }

            function setFilter(newFilter) {
                if (!angular.equals(filter, newFilter)) {
                    filter = newFilter;
                    refreshNeeded = true;
                }
            }

            function setOrderBy(newOrderBy) {
                if (!angular.equals(orderBy, newOrderBy)) {
                    orderBy = newOrderBy;
                    refreshNeeded = true;
                }
            }

            function loadNextPage() {
                loadedCount = loadedCount + pageSize;
                refreshNeeded = true;
            }

            function hasMorePages() {
                refreshIfNeeded();
                return loadedCount < availableCount;
            }

            function reset() {
                loadedCount = 0;
                refreshNeeded = true;
            }
        }

        return function (list, param) {
            if (!list) {
                return list;
            }
            var pagedList = list.pagedList;
            if (typeof param === 'string') {
                if (!pagedList) {
                    return;
                }
                // commands do not create a new paged list nor do they change the attributes of the list.
                if (param === 'loadMore') {
                    pagedList.loadNextPage();
                } else if (param === 'hasMore') {
                    return pagedList.hasMorePages();
                }
                return;
            }
            if (!pagedList) {
                pagedList = createPagedList(list);
                list.pagedList = pagedList;
            }
            if (param) {
                pagedList.setPageSize(param.pageSize);
                pagedList.setFilter(param.filter);
                pagedList.setOrderBy(param.orderBy);
            }
            pagedList.refreshIfNeeded();
            return pagedList;
        };
    }

    pagedListFilterFactory.$inject = ['defaultListPageSize', 'filterFilter', 'orderByFilter'];
    var mod = angular.module(['ng']);
    mod.constant('defaultListPageSize', 10);
    mod.filter('paged', pagedListFilterFactory);
})(window.jQuery, window.angular);