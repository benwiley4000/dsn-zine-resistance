// jscs:disable

// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeline', 'timelineEnd', 'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// Place any jQuery/helper plugins in here.

/**
 * isInViewport.js v2.2.4
 * @author  Mudit Ameta
 * @license https://github.com/zeusdeux/isInViewport/blob/master/license.md MIT
 */
(function($, window) {

    // polyfilling trim for ie < 9. sigh ;-;
    if (!String.prototype.hasOwnProperty('trim')) {
        String.prototype.trim = function() {
            return this.replace(/^\s*(.*?)\s*$/, '$1');
        };
    }

    //lets you chain any arbitrary function or an array of functions and returns a jquery object
    var run = function(args) {
        if (arguments.length === 1 && typeof args === 'function')
            args = [args];

        if (!(args instanceof Array))
            throw new SyntaxError('isInViewport: Argument(s) passed to .do/.run should be a function or an array of functions');

        for (var i = 0; i < args.length; i++) {
            if (typeof args[i] !== 'function') {
                console.warn('isInViewport: Argument(s) passed to .do/.run should be a function or an array of functions');
                console.warn('isInViewport: Ignoring non-function values in array and moving on');
                continue;
            }
            for (var j = 0; j < this.length; j++)
                args[i].call($(this[j]));
        }
        return this;
    };

    //do is a reserved word and hence using it as a property throws on some browsers
    //it is now aliased as $.fn.run
    $.fn['do'] = function(args) {
        console.warn('isInViewport: .do causes issues in IE and some browsers since its a reserved. Use $.fn.run instead i.e., $(el).run(fn).');
        return run(args);
    };
    $.fn.run = run;

    //gets the width of the scrollbar
    function getScrollbarWidth(viewport) {
        var scrollBarWidth;

        //append a div that has 100% width to get true width of viewport
        var el = $('<div></div>').css({
            'width': '100%'
        });
        viewport.append(el);

        //subtract true width from the viewport width which is inclusive
        //of scrollbar by default
        scrollBarWidth = viewport.width() - el.width();

        //remove our element from DOM
        el.remove();
        return scrollBarWidth;
    }

    function isInViewport(element, options) {
        var boundingRect  = element.getBoundingClientRect();
        var top           = boundingRect.top;
        var bottom        = boundingRect.bottom;
        var left          = boundingRect.left;
        var right         = boundingRect.right;
        var settings      = $.extend({
            'tolerance': 0,
            'viewport': window
        }, options);
        var isVisibleFlag = false;
        var $viewport     = settings.viewport.jquery ? settings.viewport : $(settings.viewport);

        if (!$viewport.length) {
            console.warn('isInViewport: The viewport selector you have provided matches no element on page.');
            console.warn('isInViewport: Defaulting to viewport as window');
            $viewport = $(window);
        }

        var $viewportHeight = $viewport.height();
        var $viewportWidth  = $viewport.width();
        var typeofViewport  = $viewport.get(0).toString();

        //if the viewport is other than window recalculate the top,
        //bottom,left and right wrt the new viewport
        //the [object DOMWindow] check is for window object type in PhantomJS
        if ($viewport[0] !== window && typeofViewport !== '[object Window]' && typeofViewport !== '[object DOMWindow]') {
            // Use getBoundingClientRect() instead of $.Offset()
            // since the original top/bottom positions are calculated relative to browser viewport and not document
            var viewportRect = $viewport.get(0).getBoundingClientRect();

            //recalculate these relative to viewport
            top    = top - viewportRect.top;
            bottom = bottom - viewportRect.top;
            left   = left - viewportRect.left;
            right  = right - viewportRect.left;

            //get the scrollbar width from cache or calculate it
            isInViewport.scrollBarWidth = isInViewport.scrollBarWidth || getScrollbarWidth($viewport);

            //remove the width of the scrollbar from the viewport width
            $viewportWidth -= isInViewport.scrollBarWidth;
        }

        //handle falsy, non-number and non-integer tolerance value
        //same as checking using isNaN and then setting to 0
        //bitwise operators deserve some love too you know
        settings.tolerance = ~~Math.round(parseFloat(settings.tolerance));

        if (settings.tolerance < 0)
            settings.tolerance = $viewportHeight + settings.tolerance; //viewport height - tol

        //the element is NOT in viewport iff it is completely out of
        //viewport laterally or if it is completely out of the tolerance
        //region. Therefore, if it is partially in view then it is considered
        //to be in the viewport and hence true is returned. Because we have adjusted
        //the left/right positions relative to the viewport, we should check the
        //element's right against the viewport's 0 (left side), and the element's
        //left against the viewport's width to see if it is outside of the viewport.

        if (right <= 0 || left >= $viewportWidth)
            return isVisibleFlag;

        //if the element is bound to some tolerance
        isVisibleFlag = settings.tolerance ? !!(top <= settings.tolerance && bottom >= settings.tolerance) : !!(bottom > 0 && top <= $viewportHeight);

        return isVisibleFlag;
    }

    $.extend($.expr[':'], {
        'in-viewport': function(currObj, index, meta) {
            if (!!meta[3]) {
                var args = meta[3].split(',');

                //when user only gives viewport and no tolerance
                if (args.length === 1 && isNaN(args[0])) {
                    args[1] = args[0];
                    args[0] = void 0;
                }

                return isInViewport(currObj, {
                    tolerance: args[0] ? args[0].trim() : void 0,
                    viewport: args[1] ? args[1].trim() : void 0
                });
            }
            else
                return isInViewport(currObj);
        }
    });
})(jQuery, window);

/*!
 Waypoints - 4.0.0
 Copyright © 2011-2015 Caleb Troughton
 Licensed under the MIT license.
 https://github.com/imakewebthings/waypoints/blog/master/licenses.txt
 */
(function() {
    'use strict'

    var keyCounter = 0
    var allWaypoints = {}

    /* http://imakewebthings.com/waypoints/api/waypoint */
    function Waypoint(options) {
        if (!options) {
            throw new Error('No options passed to Waypoint constructor')
        }
        if (!options.element) {
            throw new Error('No element option passed to Waypoint constructor')
        }
        if (!options.handler) {
            throw new Error('No handler option passed to Waypoint constructor')
        }

        this.key = 'waypoint-' + keyCounter
        this.options = Waypoint.Adapter.extend({}, Waypoint.defaults, options)
        this.element = this.options.element
        this.adapter = new Waypoint.Adapter(this.element)
        this.callback = options.handler
        this.axis = this.options.horizontal ? 'horizontal' : 'vertical'
        this.enabled = this.options.enabled
        this.triggerPoint = null
        this.group = Waypoint.Group.findOrCreate({
            name: this.options.group,
            axis: this.axis
        })
        this.context = Waypoint.Context.findOrCreateByElement(this.options.context)

        if (Waypoint.offsetAliases[this.options.offset]) {
            this.options.offset = Waypoint.offsetAliases[this.options.offset]
        }
        this.group.add(this)
        this.context.add(this)
        allWaypoints[this.key] = this
        keyCounter += 1
    }

    /* Private */
    Waypoint.prototype.queueTrigger = function(direction) {
        this.group.queueTrigger(this, direction)
    }

    /* Private */
    Waypoint.prototype.trigger = function(args) {
        if (!this.enabled) {
            return
        }
        if (this.callback) {
            this.callback.apply(this, args)
        }
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/destroy */
    Waypoint.prototype.destroy = function() {
        this.context.remove(this)
        this.group.remove(this)
        delete allWaypoints[this.key]
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/disable */
    Waypoint.prototype.disable = function() {
        this.enabled = false
        return this
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/enable */
    Waypoint.prototype.enable = function() {
        this.context.refresh()
        this.enabled = true
        return this
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/next */
    Waypoint.prototype.next = function() {
        return this.group.next(this)
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/previous */
    Waypoint.prototype.previous = function() {
        return this.group.previous(this)
    }

    /* Private */
    Waypoint.invokeAll = function(method) {
        var allWaypointsArray = []
        for (var waypointKey in allWaypoints) {
            allWaypointsArray.push(allWaypoints[waypointKey])
        }
        for (var i = 0, end = allWaypointsArray.length; i < end; i++) {
            allWaypointsArray[i][method]()
        }
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/destroy-all */
    Waypoint.destroyAll = function() {
        Waypoint.invokeAll('destroy')
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/disable-all */
    Waypoint.disableAll = function() {
        Waypoint.invokeAll('disable')
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/enable-all */
    Waypoint.enableAll = function() {
        Waypoint.invokeAll('enable')
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/refresh-all */
    Waypoint.refreshAll = function() {
        Waypoint.Context.refreshAll()
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/viewport-height */
    Waypoint.viewportHeight = function() {
        return window.innerHeight || document.documentElement.clientHeight
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/viewport-width */
    Waypoint.viewportWidth = function() {
        return document.documentElement.clientWidth
    }

    Waypoint.adapters = []

    Waypoint.defaults = {
        context: window,
        continuous: true,
        enabled: true,
        group: 'default',
        horizontal: false,
        offset: 0
    }

    Waypoint.offsetAliases = {
        'bottom-in-view': function() {
            return this.context.innerHeight() - this.adapter.outerHeight()
        },
        'right-in-view': function() {
            return this.context.innerWidth() - this.adapter.outerWidth()
        }
    }

    window.Waypoint = Waypoint
}())
;(function() {
    'use strict'

    function requestAnimationFrameShim(callback) {
        window.setTimeout(callback, 1000 / 60)
    }

    var keyCounter = 0
    var contexts = {}
    var Waypoint = window.Waypoint
    var oldWindowLoad = window.onload

    /* http://imakewebthings.com/waypoints/api/context */
    function Context(element) {
        this.element = element
        this.Adapter = Waypoint.Adapter
        this.adapter = new this.Adapter(element)
        this.key = 'waypoint-context-' + keyCounter
        this.didScroll = false
        this.didResize = false
        this.oldScroll = {
            x: this.adapter.scrollLeft(),
            y: this.adapter.scrollTop()
        }
        this.waypoints = {
            vertical: {},
            horizontal: {}
        }

        element.waypointContextKey = this.key
        contexts[element.waypointContextKey] = this
        keyCounter += 1

        this.createThrottledScrollHandler()
        this.createThrottledResizeHandler()
    }

    /* Private */
    Context.prototype.add = function(waypoint) {
        var axis = waypoint.options.horizontal ? 'horizontal' : 'vertical'
        this.waypoints[axis][waypoint.key] = waypoint
        this.refresh()
    }

    /* Private */
    Context.prototype.checkEmpty = function() {
        var horizontalEmpty = this.Adapter.isEmptyObject(this.waypoints.horizontal)
        var verticalEmpty = this.Adapter.isEmptyObject(this.waypoints.vertical)
        if (horizontalEmpty && verticalEmpty) {
            this.adapter.off('.waypoints')
            delete contexts[this.key]
        }
    }

    /* Private */
    Context.prototype.createThrottledResizeHandler = function() {
        var self = this

        function resizeHandler() {
            self.handleResize()
            self.didResize = false
        }

        this.adapter.on('resize.waypoints', function() {
            if (!self.didResize) {
                self.didResize = true
                Waypoint.requestAnimationFrame(resizeHandler)
            }
        })
    }

    /* Private */
    Context.prototype.createThrottledScrollHandler = function() {
        var self = this
        function scrollHandler() {
            self.handleScroll()
            self.didScroll = false
        }

        this.adapter.on('scroll.waypoints', function() {
            if (!self.didScroll || Waypoint.isTouch) {
                self.didScroll = true
                Waypoint.requestAnimationFrame(scrollHandler)
            }
        })
    }

    /* Private */
    Context.prototype.handleResize = function() {
        Waypoint.Context.refreshAll()
    }

    /* Private */
    Context.prototype.handleScroll = function() {
        var triggeredGroups = {}
        var axes = {
            horizontal: {
                newScroll: this.adapter.scrollLeft(),
                oldScroll: this.oldScroll.x,
                forward: 'right',
                backward: 'left'
            },
            vertical: {
                newScroll: this.adapter.scrollTop(),
                oldScroll: this.oldScroll.y,
                forward: 'down',
                backward: 'up'
            }
        }

        for (var axisKey in axes) {
            var axis = axes[axisKey]
            var isForward = axis.newScroll > axis.oldScroll
            var direction = isForward ? axis.forward : axis.backward

            for (var waypointKey in this.waypoints[axisKey]) {
                var waypoint = this.waypoints[axisKey][waypointKey]
                var wasBeforeTriggerPoint = axis.oldScroll < waypoint.triggerPoint
                var nowAfterTriggerPoint = axis.newScroll >= waypoint.triggerPoint
                var crossedForward = wasBeforeTriggerPoint && nowAfterTriggerPoint
                var crossedBackward = !wasBeforeTriggerPoint && !nowAfterTriggerPoint
                if (crossedForward || crossedBackward) {
                    waypoint.queueTrigger(direction)
                    triggeredGroups[waypoint.group.id] = waypoint.group
                }
            }
        }

        for (var groupKey in triggeredGroups) {
            triggeredGroups[groupKey].flushTriggers()
        }

        this.oldScroll = {
            x: axes.horizontal.newScroll,
            y: axes.vertical.newScroll
        }
    }

    /* Private */
    Context.prototype.innerHeight = function() {
        /*eslint-disable eqeqeq */
        if (this.element == this.element.window) {
            return Waypoint.viewportHeight()
        }
        /*eslint-enable eqeqeq */
        return this.adapter.innerHeight()
    }

    /* Private */
    Context.prototype.remove = function(waypoint) {
        delete this.waypoints[waypoint.axis][waypoint.key]
        this.checkEmpty()
    }

    /* Private */
    Context.prototype.innerWidth = function() {
        /*eslint-disable eqeqeq */
        if (this.element == this.element.window) {
            return Waypoint.viewportWidth()
        }
        /*eslint-enable eqeqeq */
        return this.adapter.innerWidth()
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/context-destroy */
    Context.prototype.destroy = function() {
        var allWaypoints = []
        for (var axis in this.waypoints) {
            for (var waypointKey in this.waypoints[axis]) {
                allWaypoints.push(this.waypoints[axis][waypointKey])
            }
        }
        for (var i = 0, end = allWaypoints.length; i < end; i++) {
            allWaypoints[i].destroy()
        }
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/context-refresh */
    Context.prototype.refresh = function() {
        /*eslint-disable eqeqeq */
        var isWindow = this.element == this.element.window
        /*eslint-enable eqeqeq */
        var contextOffset = isWindow ? undefined : this.adapter.offset()
        var triggeredGroups = {}
        var axes

        this.handleScroll()
        axes = {
            horizontal: {
                contextOffset: isWindow ? 0 : contextOffset.left,
                contextScroll: isWindow ? 0 : this.oldScroll.x,
                contextDimension: this.innerWidth(),
                oldScroll: this.oldScroll.x,
                forward: 'right',
                backward: 'left',
                offsetProp: 'left'
            },
            vertical: {
                contextOffset: isWindow ? 0 : contextOffset.top,
                contextScroll: isWindow ? 0 : this.oldScroll.y,
                contextDimension: this.innerHeight(),
                oldScroll: this.oldScroll.y,
                forward: 'down',
                backward: 'up',
                offsetProp: 'top'
            }
        }

        for (var axisKey in axes) {
            var axis = axes[axisKey]
            for (var waypointKey in this.waypoints[axisKey]) {
                var waypoint = this.waypoints[axisKey][waypointKey]
                var adjustment = waypoint.options.offset
                var oldTriggerPoint = waypoint.triggerPoint
                var elementOffset = 0
                var freshWaypoint = oldTriggerPoint == null
                var contextModifier, wasBeforeScroll, nowAfterScroll
                var triggeredBackward, triggeredForward

                if (waypoint.element !== waypoint.element.window) {
                    elementOffset = waypoint.adapter.offset()[axis.offsetProp]
                }

                if (typeof adjustment === 'function') {
                    adjustment = adjustment.apply(waypoint)
                }
                else if (typeof adjustment === 'string') {
                    adjustment = parseFloat(adjustment)
                    if (waypoint.options.offset.indexOf('%') > - 1) {
                        adjustment = Math.ceil(axis.contextDimension * adjustment / 100)
                    }
                }

                contextModifier = axis.contextScroll - axis.contextOffset
                waypoint.triggerPoint = elementOffset + contextModifier - adjustment
                wasBeforeScroll = oldTriggerPoint < axis.oldScroll
                nowAfterScroll = waypoint.triggerPoint >= axis.oldScroll
                triggeredBackward = wasBeforeScroll && nowAfterScroll
                triggeredForward = !wasBeforeScroll && !nowAfterScroll

                if (!freshWaypoint && triggeredBackward) {
                    waypoint.queueTrigger(axis.backward)
                    triggeredGroups[waypoint.group.id] = waypoint.group
                }
                else if (!freshWaypoint && triggeredForward) {
                    waypoint.queueTrigger(axis.forward)
                    triggeredGroups[waypoint.group.id] = waypoint.group
                }
                else if (freshWaypoint && axis.oldScroll >= waypoint.triggerPoint) {
                    waypoint.queueTrigger(axis.forward)
                    triggeredGroups[waypoint.group.id] = waypoint.group
                }
            }
        }

        Waypoint.requestAnimationFrame(function() {
            for (var groupKey in triggeredGroups) {
                triggeredGroups[groupKey].flushTriggers()
            }
        })

        return this
    }

    /* Private */
    Context.findOrCreateByElement = function(element) {
        return Context.findByElement(element) || new Context(element)
    }

    /* Private */
    Context.refreshAll = function() {
        for (var contextId in contexts) {
            contexts[contextId].refresh()
        }
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/context-find-by-element */
    Context.findByElement = function(element) {
        return contexts[element.waypointContextKey]
    }

    window.onload = function() {
        if (oldWindowLoad) {
            oldWindowLoad()
        }
        Context.refreshAll()
    }

    Waypoint.requestAnimationFrame = function(callback) {
        var requestFn = window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            requestAnimationFrameShim
        requestFn.call(window, callback)
    }
    Waypoint.Context = Context
}())
;(function() {
    'use strict'

    function byTriggerPoint(a, b) {
        return a.triggerPoint - b.triggerPoint
    }

    function byReverseTriggerPoint(a, b) {
        return b.triggerPoint - a.triggerPoint
    }

    var groups = {
        vertical: {},
        horizontal: {}
    }
    var Waypoint = window.Waypoint

    /* http://imakewebthings.com/waypoints/api/group */
    function Group(options) {
        this.name = options.name
        this.axis = options.axis
        this.id = this.name + '-' + this.axis
        this.waypoints = []
        this.clearTriggerQueues()
        groups[this.axis][this.name] = this
    }

    /* Private */
    Group.prototype.add = function(waypoint) {
        this.waypoints.push(waypoint)
    }

    /* Private */
    Group.prototype.clearTriggerQueues = function() {
        this.triggerQueues = {
            up: [],
            down: [],
            left: [],
            right: []
        }
    }

    /* Private */
    Group.prototype.flushTriggers = function() {
        for (var direction in this.triggerQueues) {
            var waypoints = this.triggerQueues[direction]
            var reverse = direction === 'up' || direction === 'left'
            waypoints.sort(reverse ? byReverseTriggerPoint : byTriggerPoint)
            for (var i = 0, end = waypoints.length; i < end; i += 1) {
                var waypoint = waypoints[i]
                if (waypoint.options.continuous || i === waypoints.length - 1) {
                    waypoint.trigger([direction])
                }
            }
        }
        this.clearTriggerQueues()
    }

    /* Private */
    Group.prototype.next = function(waypoint) {
        this.waypoints.sort(byTriggerPoint)
        var index = Waypoint.Adapter.inArray(waypoint, this.waypoints)
        var isLast = index === this.waypoints.length - 1
        return isLast ? null : this.waypoints[index + 1]
    }

    /* Private */
    Group.prototype.previous = function(waypoint) {
        this.waypoints.sort(byTriggerPoint)
        var index = Waypoint.Adapter.inArray(waypoint, this.waypoints)
        return index ? this.waypoints[index - 1] : null
    }

    /* Private */
    Group.prototype.queueTrigger = function(waypoint, direction) {
        this.triggerQueues[direction].push(waypoint)
    }

    /* Private */
    Group.prototype.remove = function(waypoint) {
        var index = Waypoint.Adapter.inArray(waypoint, this.waypoints)
        if (index > -1) {
            this.waypoints.splice(index, 1)
        }
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/first */
    Group.prototype.first = function() {
        return this.waypoints[0]
    }

    /* Public */
    /* http://imakewebthings.com/waypoints/api/last */
    Group.prototype.last = function() {
        return this.waypoints[this.waypoints.length - 1]
    }

    /* Private */
    Group.findOrCreate = function(options) {
        return groups[options.axis][options.name] || new Group(options)
    }

    Waypoint.Group = Group
}())
;(function() {
    'use strict'

    var $ = window.jQuery
    var Waypoint = window.Waypoint

    function JQueryAdapter(element) {
        this.$element = $(element)
    }

    $.each([
        'innerHeight',
        'innerWidth',
        'off',
        'offset',
        'on',
        'outerHeight',
        'outerWidth',
        'scrollLeft',
        'scrollTop'
    ], function(i, method) {
        JQueryAdapter.prototype[method] = function() {
            var args = Array.prototype.slice.call(arguments)
            return this.$element[method].apply(this.$element, args)
        }
    })

    $.each([
        'extend',
        'inArray',
        'isEmptyObject'
    ], function(i, method) {
        JQueryAdapter[method] = $[method]
    })

    Waypoint.adapters.push({
        name: 'jquery',
        Adapter: JQueryAdapter
    })
    Waypoint.Adapter = JQueryAdapter
}())
;(function() {
    'use strict'

    var Waypoint = window.Waypoint

    function createExtension(framework) {
        return function() {
            var waypoints = []
            var overrides = arguments[0]

            if (framework.isFunction(arguments[0])) {
                overrides = framework.extend({}, arguments[1])
                overrides.handler = arguments[0]
            }

            this.each(function() {
                var options = framework.extend({}, overrides, {
                    element: this
                })
                if (typeof options.context === 'string') {
                    options.context = framework(this).closest(options.context)[0]
                }
                waypoints.push(new Waypoint(options))
            })

            return waypoints
        }
    }

    if (window.jQuery) {
        window.jQuery.fn.waypoint = createExtension(window.jQuery)
    }
    if (window.Zepto) {
        window.Zepto.fn.waypoint = createExtension(window.Zepto)
    }
}())
;