'use strict';

angular.module('miwurster.utils', []);

angular.module('miwurster.utils')

    .service('utils', function () {
        this.isEmpty = function (text) {
            return (!text || 0 === text.length);
        };
        this.isBlank = function (text) {
            return (!text || /^\s*$/.test(text));
        };
        this.isNumber = function (n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        };
    });