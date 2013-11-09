'use strict';

angular.module('miwurster.datastore', []).factory('DataStore', function () {
    var DataStore = {};

    DataStore.load = function (namespace) {
        var result = localStorage.getItem(namespace);
        return (result && JSON.parse(result)) || {};
    };

    DataStore.save = function (namespace, data) {
        localStorage.setItem(namespace, JSON.stringify(data));
    };

    return DataStore;
});