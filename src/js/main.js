$(function () {

    var pages = [
        'front-cover',
        'back-cover',
        'intro'

    ];
    var pageCount = pages.length;

    var $pageNumber = $('#page-number');

    var hidePageNumber = null;
    $(window).scroll(function () {
        if (hidePageNumber) {
            clearTimeout(hidePageNumber);
        }
        var tolerance = Math.floor($(window).height() * 0.4);
        var currentPage = $('.page:in-viewport(' + tolerance + '):first')[0];
        var currentPageNumber = pages.indexOf(currentPage.id) + 1;
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
