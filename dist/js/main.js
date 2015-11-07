$(function () {

    /* Perhaps this isn't foolproof, but it should let
     * us know if we're on a mobile device.
     * http://stackoverflow.com/a/3540295/4956731
     */
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);




    /* we'll add functions to this list and
     * run them at the end of the script
     */
    var toRunOnResize = [];



    /* display prompt telling user how to control the page
     * (unless we think we're on a mobile device)
     */
    var controlsPromptCleared = true;
    var controlsPrompt = document.getElementById('controls-prompt');
    // function will be called after initial jump points are found
    var loadControlsPrompt = function () {
        if (!isMobile) {
            controlsPrompt.style.opacity = 1.0;
            controlsPromptCleared = false;
        }
    };
    $(window).scroll(function () {
        if (!controlsPromptCleared) {
            controlsPrompt.style.opacity = 0;
            controlsPromptCleared = true;
            setTimeout(function () {
                controlsPrompt.style.display = 'none';
            }, 1000);
        }
    });




    var containerTypesToUpdate = ['full-section', 'full-section-exact', 'content-column'];

    var heightPropertiesToCheck = ['height', 'min-height'];

    var fetchCSSPropertyValueFromStylesheet = function (selector, property) {
        for (var i = 0, sheetsLen = document.styleSheets.length; i < sheetsLen; i++) {
            var sheet = document.styleSheets[i];
            if (sheet.disabled || !sheet.cssRules || !sheet.cssRules.length) {
                continue;
            }
            for (var j = 0, rulesLen = sheet.cssRules.length; j < rulesLen; j++) {
                var rule = sheet.cssRules[j];
                if (!rule.selectorText) {
                    continue;
                }
                var selectorIndex = rule.selectorText.indexOf(selector);
                if (selectorIndex === -1) {
                    continue;
                }
                var charAfter = rule.selectorText.charAt(selectorIndex + selector.length);
                if ((!charAfter || charAfter === ' ' || charAfter === ',') && rule.style[property]) {
                    return rule.style[property];
                }
            }
        }
        return null;
    };

    var updateContainerHeights = function () {
        containerTypesToUpdate.forEach(function (className) {
            var viewportHeight = $(window).height();
            var selector = '.' + className;
            heightPropertiesToCheck.forEach(function (property) {
                // note: condition fails (as desired) if the value is 0.
                if (parseInt(document.querySelector(selector).style[property]) ||
                    parseInt(fetchCSSPropertyValueFromStylesheet(selector, property))) {
                    $(selector).each(function () {
                        $(this).css(property, viewportHeight);
                    });
                }
            });
        });
    };

    /*
     * replace vh height rules with hard-coded values, and only update
     * them when the viewport WIDTH changes, to avoid annoying phenomenon
     * on mobile browsers where scrolling will trigger a show/hide of
     * the url bar and change the viewport size sporadically, prompting
     * position jump.
     */
    updateContainerHeights();
    toRunOnResize.push({
        fn: updateContainerHeights,
        mustChange: {
            width: true,
            height: false
        }
    });




    var pages = $('.page').map(function () {
        return this.id;
    }).get();
    var pageCount = pages.length;

    var rootPath = window.location.pathname;

    var $pageNumber = $('#page-number');

    var pageNumberTimeout = null;

    var changePageNumber = function (pageNumber) {
        if (parseInt($pageNumber.text().split(' / ')[0]) !== pageNumber) {
            clearTimeout(pageNumberTimeout);
            $pageNumber.text(pageNumber + ' / ' + pageCount);
            if (parseInt($pageNumber.css('opacity')) !== 1) {
                $pageNumber.css('opacity', 1.0);
            }
            pageNumberTimeout = setTimeout(function () {
                $pageNumber.css('opacity', 0);
            }, 1000);
        }
    };

    /* change URL hash and display page number
     * (if not already displayed) each time we enter a new page
     */
    pages.forEach(function (pageName, index) {
        return new window.Waypoint({
            element: document.getElementById(pageName),
            handler: function(direction) {
                var hash = pageName;
                var hashIndex = index;
                if (index > 0 && direction === 'up') {
                    hash = pages[index - 1];
                    hashIndex = index - 1;
                }
                if (hashIndex > 0) {
                    history.replaceState(null, null, rootPath + '#' + hash);
                } else {
                    history.replaceState(null, null, rootPath);
                }

                changePageNumber(hashIndex + 1);
            }
        });
    });




    var jumpPoints = [];
    var pageNumberLookupByOffset = {};

    var generateJumpPoints = function () {
        jumpPoints = [];
        var lastOffset = null;
        var viewportHeight = $(window).height();
        pages.forEach(function (pageName, index) {
            var $page = $('#' + pageName);
            var newOffset = Math.floor($page.offset().top);
            var spaceAbove = newOffset;
            var prevElem = $page.prev().get(0);
            if (prevElem && prevElem.tagName === 'HR') {
                spaceAbove -= $(prevElem).outerHeight(true);
            }
            while ((lastOffset || lastOffset === 0) && spaceAbove - lastOffset > viewportHeight) {
                lastOffset = Math.floor(Math.min(lastOffset + viewportHeight, spaceAbove - viewportHeight));
                jumpPoints.push(lastOffset);
                if (index > 0) {
                    pageNumberLookupByOffset[lastOffset] = index;
                }
            }
            lastOffset = newOffset;
            jumpPoints.push(lastOffset);
            pageNumberLookupByOffset[lastOffset] = index + 1;
        });
        var pageEnd = Math.floor($(document).height());
        while ((lastOffset || lastOffset === 0) && pageEnd - lastOffset > viewportHeight) {
            lastOffset = Math.floor(Math.min(lastOffset + viewportHeight, pageEnd - viewportHeight));
            jumpPoints.push(lastOffset);
            pageNumberLookupByOffset[lastOffset] = pages.length;
        }
    };

    /* we should be sure all images are loaded before
     * we generate jump points. code for executing a
     * function after all images have finished borrowed
     * from: http://stackoverflow.com/a/4857910/4956731
     */
    var images = $('img');
    var counter = images.length;
    var imageLoaded = function () {
        counter--;
        if (counter === 0) {
            generateJumpPoints();
            loadControlsPrompt();
        }
    };
    images.each(function() {
        if (this.complete) {
            imageLoaded();
        } else {
            $(this).one('load', imageLoaded);
        }
    }).error(function () {
        // in case an image is broken...
        imageLoaded();
        $(this).hide();
    });

    /* similar to updateContainerHeights, run on height change
     * if it's not simply a mobile url bar showing/hiding.
     */
    toRunOnResize.push({
        fn: generateJumpPoints,
        mustChange: {
            width: true,
            height: true
        }
    });




    var jumpToClosestPage = function (direction) {
        var jumpIndex = determineJumpIndex(direction);
        var jumpYValue = jumpPoints[jumpIndex];
        if (jumpYValue || jumpYValue === 0) {
            $('html, body').animate({
                scrollTop: jumpYValue
            }, 600);
            changePageNumber(pageNumberLookupByOffset[jumpYValue]);
        }
    };

    var determineJumpIndex = function (direction) {
        if (direction !== 'up' && direction !== 'down') {
            return null;
        }

        var currentYPosition = $(window).scrollTop();
        var closestJumpIndex = searchForClosestJumpIndex(currentYPosition);
        if (!(closestJumpIndex || closestJumpIndex === 0)) {
            return null;
        }
        if (direction === 'down') {
            return jumpPoints[closestJumpIndex + 1] ? closestJumpIndex + 1 : closestJumpIndex;
        }
        // or if direction === 'up' ...
        if (currentYPosition === jumpPoints[closestJumpIndex]) {
            return closestJumpIndex > 0 ? closestJumpIndex - 1 : closestJumpIndex;
        }
        return closestJumpIndex;
    };

    /* binary search for the index of the closest jump
     * value less than or equal to currentYPosition
     */
    var searchForClosestJumpIndex = function (currentYPosition, minInclusive, maxExclusive) {
        if (!(minInclusive || minInclusive === 0) || !maxExclusive) {
            return searchForClosestJumpIndex(currentYPosition, 0, jumpPoints.length);
        }
        if (minInclusive >= maxExclusive) {
            return null;
        }
        if (minInclusive + 1 === maxExclusive) {
            return minInclusive;
        }
        var middleIndex = Math.floor((minInclusive + maxExclusive) / 2);
        var middleValue = jumpPoints[middleIndex];
        if (currentYPosition === middleValue) {
            return middleIndex;
        }
        if (currentYPosition > middleValue)  {
            return searchForClosestJumpIndex(currentYPosition, middleIndex, maxExclusive);
        }
        return searchForClosestJumpIndex(currentYPosition, minInclusive, middleIndex);
    };

    /* activate page jump when up or down key is pressed
     * 38: up arrow, 40: down arrow, 32: space
     */
    var navDisabled = false;
    $(window).keydown(function (e) {
        if (!(e.which === 32 || e.which === 38 || e.which === 40)) {
            return;
        }
        e.preventDefault();
        if (navDisabled) {
            return;
        }
        navDisabled = true;

        var direction = null;
        if (e.which === 38) {
            direction = 'up';
        } else {
            direction = 'down';
        }
        jumpToClosestPage(direction);
    });
    $(window).keyup(function () {
        navDisabled = false;
    });




    // set up event handler to run specified functions on resize
    var lastWindowWidth = $(window).width();
    var lastWindowHeight = $(window).height();
    $(window).resize(function () {
        var newWindowWidth = $(window).width();
        var newWindowHeight = $(window).height();
        var isWidthDifferent = lastWindowWidth !== newWindowWidth;
        var isHeightDifferent = lastWindowHeight !== newWindowHeight;
        toRunOnResize.forEach(function (obj) {
            if (!isMobile ||
                ((isWidthDifferent || !obj.mustChange.width) &&
                (isHeightDifferent || !obj.mustChange.height))) {
                obj.fn();
            }
        });
        lastWindowWidth = newWindowWidth;
        lastWindowHeight = newWindowHeight;
    });

});
