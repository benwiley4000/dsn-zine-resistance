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




    var allowKeyNav = false;



    if (allowKeyNav) {

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

    }




    var containerTypesToUpdate = [
        'full-section',
        'full-section-exact',
        'content-column'// ,
        // 'column-content-container',
        // 'page'
    ];

    var heightPropertiesToCheck = ['height', 'min-height'];

    // NOT A GOOD SOLUTION. FIX!!
    var fetchCSSPropertyValueFromStylesheet = function (selector, property) {
        var lastValue = null;
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
                    lastValue = rule.style[property];
                }
            }
        }
        return lastValue;
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

    var disablePageNumberChange = false;

    var listItems = []; // will be populated later on with content-list-item li elements

    var markListItemAsNotCurrent = function (listItem) {
        listItem.classList.remove('current');
    };

    var markAllListItemsAsNotCurrent = function () {
        listItems.forEach(markListItemAsNotCurrent);
    };

    var changePageNumber = function (pageNumber) {
        if (disablePageNumberChange || parseInt($pageNumber.text().split(' / ')[0]) === pageNumber) {
            return;
        }
        clearTimeout(pageNumberTimeout);
        $pageNumber.text(pageNumber + ' / ' + pageCount);
        if (parseInt($pageNumber.css('opacity')) !== 1) {
            $pageNumber.css('opacity', 1.0);
        }
        markAllListItemsAsNotCurrent();
        var listItem = listItems[pageNumber - 1];
        if (listItem) {
            listItem.classList.add('current');
        }
        pageNumberTimeout = setTimeout(function () {
            $pageNumber.css('opacity', 0);
        }, 1000);

        // function is defined further down the page
        renderShareWindow();
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
    var offsetLookupByPageId = {};

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
            offsetLookupByPageId[pageName] = lastOffset;
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
            if (allowKeyNav) {
                loadControlsPrompt();
            }
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




    var jumpToOffset = function (offset, callback) {
        if (offset || offset === 0) {
            $('html, body').animate({
                scrollTop: offset
            }, 600, function () {
                if (callback) {
                    callback();
                }
            });
            changePageNumber(pageNumberLookupByOffset[offset]);
        }
    };

    var contentsList = document.getElementById('contents-list');

    // populate contents list with items that link to their associated pages
    var switchPageNumberSwitchingBackOn = function () {
        disablePageNumberChange = false;
    };
    Array.prototype.forEach.call(document.getElementsByClassName('page'), function (pageDiv, index) {
        var pageNumber = index + 1;
        var listItem = document.createElement('li');
        listItem.innerHTML = pageNumber + ' : ' + pageDiv.getAttribute('data-name');
        listItem.classList.add('contents-list-item');
        listItem.addEventListener('click', function () {
            changePageNumber(pageNumber);
            disablePageNumberChange = true;
            jumpToOffset(offsetLookupByPageId[pageDiv.id], switchPageNumberSwitchingBackOn);
        }, false);
        listItems.push(listItem);
        contentsList.appendChild(listItem);
    });
    listItems[0].classList.add('current');




    var jumpToClosestPage = function (direction) {
        var jumpIndex = determineJumpIndex(direction);
        var jumpYValue = jumpPoints[jumpIndex];
        jumpToOffset(jumpYValue);
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

    if (allowKeyNav) {

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

    }




    var getCurrentListItem = function () {
        return document.querySelector('.contents-list-item.current');
    };

    /* add listeners to open/close menu when clicked, to disable pulsating after
     * first opening, and to close the menu when a click happens anywhere else.
     */
    var menuContainer = document.getElementById('contents-menu-container');
    var menuIcon = document.getElementById('contents-menu-icon');
    menuIcon.addEventListener('click', function (e) {
        e.stopPropagation();
        if (menuContainer.classList.contains('open')) {
            menuContainer.classList.remove('open');
        } else {
            menuIcon.classList.remove('awaiting-click');
            var currentListItem = getCurrentListItem();
            contentsList.scrollTop = currentListItem.offsetTop - ((window.innerHeight - 100) / 2);
            menuContainer.classList.add('open');
        }
    }, false);
    document.getElementById('contents-menu').addEventListener('click', function (e) {
        e.stopPropagation();
    }, false);
    document.body.addEventListener('click', function () {
        menuContainer.classList.remove('open');
    }, false);



    // set up sharing window to pop up when selected from side menu
    var SHARE_URL_BASE = 'http://bit.ly/dsn-zine';

    var LONG_URL_BASE = 'http://www.studentsdivest.org/dsn_zine_telling_stories_of_resistance';

    var FACEBOOK_URL_BASE = 'https://www.facebook.com/sharer/sharer.php?u=[url]';

    var TWITTER_URL_BASE = 'http://twitter.com/share?url=[url]&text=[text]';

    var SAMPLE_TWEET_BASE = 'Zine Volume 1 from @StudentsDivest: [title]';

    var useCurrentPage = false;

    var getShareUrl = function () {
        if (useCurrentPage) {
            return SHARE_URL_BASE + window.location.hash;
        }
        return SHARE_URL_BASE;
    };

    var getLongUrl = function () {
        if (useCurrentPage) {
            return LONG_URL_BASE + window.location.hash;
        }
        return LONG_URL_BASE;
    };

    var getFacebookUrl = function () {
        return encodeURI(FACEBOOK_URL_BASE.replace('[url]', getLongUrl()));
    };

    var getTwitterUrl = function (pageName) {
        var simpleTitle = pageName.replace('<i>', '').replace('</i>', '');
        var tweet = SAMPLE_TWEET_BASE.replace('[title]', simpleTitle);
        return encodeURI(TWITTER_URL_BASE.replace('[url]', getShareUrl()).replace('[text]', tweet));
    };

    var shareUrlDiv = document.getElementById('share-window-url');
    var pageNameDiv = document.getElementById('share-window-page-name');
    var facebookIcon = document.getElementById('facebook-icon');
    var twitterIcon = document.getElementById(('twitter-icon'));
    var renderShareWindow = function () {
        var changed = false;
        var shareUrl = getShareUrl();
        if (shareUrlDiv.value !== shareUrl) {
            changed = true;
            shareUrlDiv.value = shareUrl;
        }
        var pageName = getCurrentListItem().innerHTML.split(' : ')[1];
        if (pageNameDiv.innerHTML !== pageName) {
            changed = true;
            pageNameDiv.innerHTML = pageName;
        }
        if (changed) {
            facebookIcon.href = getFacebookUrl();
            twitterIcon.href = getTwitterUrl(pageName);
        }
    };

    var useCurrentPageCheckbox = document.getElementById('share-specific-page');
    useCurrentPageCheckbox.addEventListener('change', function () {
        useCurrentPage = useCurrentPageCheckbox.checked;
        renderShareWindow();
    }, false);

    var shareWindowDiv = document.getElementById('share-window');
    var shareIconDiv = document.getElementById('share-icon');
    shareIconDiv.addEventListener('click', function () {
        renderShareWindow();
        menuContainer.classList.remove('open');
        shareWindowDiv.classList.remove('hidden');
    }, false);

    var closeShareWindowDiv = document.getElementById('share-window-close');
    closeShareWindowDiv.addEventListener('click', function () {
        shareWindowDiv.classList.add('hidden');
    }, false);

    shareWindowDiv.addEventListener('click', function (e) {
        e.stopPropagation();
    }, false);
    document.body.addEventListener('click', function () {
        shareWindowDiv.classList.add('hidden');
    }, false);



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
