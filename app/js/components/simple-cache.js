'use strict';

angular.module('miwurster.simple-cache', [])

    .factory('datastore', [function () {
        return {
            get: function (namespace) {
                var result = localStorage.getItem(namespace);
                return (result && JSON.parse(result)) || {};
            },
            put: function (namespace, data) {
                localStorage.setItem(namespace, JSON.stringify(data));
            },
            remove: function (namespace) {
                localStorage.removeItem(namespace);
            }
        };
    }]);