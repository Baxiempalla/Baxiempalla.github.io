'use strict';

define(['jquery'], function($j) {
    const SIMPLE_SWITCH = true;

    var detailsViewApi = {
        isDetailViewShowing: function() {
            return SIMPLE_SWITCH && $j('.details_view').length == true;
        }
    };

    return detailsViewApi;
});