$(function () {

    var fitSection = function () {
        var $element = $(this);
        var img = new Image();
        img.onload = function () {
            var ratio = $element.width() / this.width;
            var fitHeight = ratio * this.height;
            $element.css('height', fitHeight);
        };
        img.src = $element.css('background-image').replace(/url\(|\)$|"/ig, '');
    };

    var $fittedSections = $('.fitted-section');
    var fitSections = function () {
        $fittedSections.each(fitSection);
    };

    // Fit section height to background image dimensions
    fitSections();
    $(window).resize(fitSections);

    var pages = $('.page').map(function () {
        return this.id;
    }).get();
    var pageCount = pages.length;

    var rootPath = window.location.pathname;

    // change URL hash each time we enter a new page
    pages.forEach(function (pageName) {
        return new window.Waypoint({
            element: document.getElementById(pageName),
            handler: function(direction) {
                var index = pages.indexOf(pageName);
                var hash = pageName;
                var hashIndex = index;
                if (index > 0 && direction === 'up') {
                    hash = pages[index - 1];
                    hashIndex = index - 1;
                }
                if (hashIndex > 0) {
                    history.pushState(null, null, rootPath + '#' + hash);
                } else {
                    history.pushState(null, null, rootPath);
                }
            }
        });
    });

    var $pageNumber = $('#page-number');

    var hidePageNumber = null;

    // display the current page number for a short time each time we scroll
    $(window).scroll(function () {
        if (hidePageNumber) {
            clearTimeout(hidePageNumber);
        }
        var currentPageId = $('.page:in-viewport:first').attr('id');
        var currentPageNumber = currentPageId ? pages.indexOf(currentPageId) + 1 : -1;
        if (currentPageNumber > 0) {
            $pageNumber.text(currentPageNumber + ' / ' + pageCount);
            $pageNumber.css('opacity', 1.0);
            hidePageNumber = setTimeout(function () {
                $pageNumber.css('opacity', 0);
                hidePageNumber = null;
            }, 800);
        } else {
            $pageNumber.css('opacity', 0);
            hidePageNumber = null;
        }
    });

});
