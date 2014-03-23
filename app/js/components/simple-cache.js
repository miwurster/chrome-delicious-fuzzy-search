'use strict';

angular.module('miwurster.simple-cache', [])

    .factory('datastore', [function () {
        return {
            load: function (namespace) {
                var result = localStorage.getItem(namespace);
                return (result && JSON.parse(result)) || {};
            },
            save: function (namespace, data) {
                localStorage.setItem(namespace, JSON.stringify(data));
            }
        };
    }]);