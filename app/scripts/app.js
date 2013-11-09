'use strict';

angular.module('delicious-fuzzy-search', [
    'miwurster.base64',
    'miwurster.datastore'
]);

angular.module('delicious-fuzzy-search').run(['$rootScope', function ($rootScope) {
    $rootScope.CONST = {
        NAMESPACE_OPTIONS: 'dfs-options'
    };
    $rootScope.utils = {
        isEmpty: function (text) {
            return (!text || 0 === text.length);
        },
        isBlank: function (text) {
            return (!text || /^\s*$/.test(text));
        }
    };
}]);