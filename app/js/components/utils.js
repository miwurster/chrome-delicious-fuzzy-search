'use strict';

angular.module('miwurster.utils', []);

angular.module('miwurster.utils')

    .factory('utils', function () {
        return {
            isEmpty: function (text) {
                return (!text || 0 === text.length);
            },
            isBlank: function (text) {
                return (!text || /^\s*$/.test(text));
            },
            isNumber: function (n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            }
        };
    });