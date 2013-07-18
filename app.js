'use strict';

var NAMESPACE_OPTIONS = 'dfs-options-dev';
var NAMESPACE_CACHE = 'dfs-cache-dev';

var module = angular.module('delicious-fuzzy-search', ['ngResource']);

module.run(function ($rootScope) {
    $rootScope.utils = {
        isEmpty: function (text) {
            return (!text || 0 === text.length);
        },
        isBlank: function (text) {
            return (!text || /^\s*$/.test(text));
        }
    };
});

module.factory('DataStore', function () {
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

module.factory('Delicious', [ '$resource', function ($resource) {
    var Delicious = {};

    Delicious.api = $resource(
        'https://feeds.delicious.com/v2/json/:username',
        {username: 'foo', count: 100, callback: 'JSON_CALLBACK'},
        {get: {method: 'JSONP', isArray: true}}
    );

    Delicious.load = function (username, callback) {
        return Delicious.api.get({username: username}, callback);
    };

    return Delicious;
}]);

module.filter('fuzzyFilter', function () {
    return function (items, searchTerm) {

        if (!searchTerm || /^\s*$/.test(searchTerm)) {
            return items;
        }

        var options = { keys: ['d', 't'] };
        var fuse = new Fuse(items, options);

        return fuse.search(searchTerm);
    }
});

module.controller('OptionsController', function ($scope, DataStore) {
    $scope.data = {};
    $scope.data.username = '';

    $scope.init = function () {
        $scope.data = DataStore.load(NAMESPACE_OPTIONS);
    };

    $scope.save = function () {
        DataStore.save(NAMESPACE_OPTIONS, $scope.data);
    };

    $scope.init();
});

module.controller('CacheController', function ($scope, DataStore, Delicious) {
    $scope.cache = {};
    $scope.cache.lastUpdate = undefined;
    $scope.cache.bookmarks = [];

    $scope.searchTerm = '';

    $scope.init = function () {
        $scope.cache = DataStore.load(NAMESPACE_CACHE);
    };

    $scope.refresh = function () {
        var username = DataStore.load(NAMESPACE_OPTIONS).username;
        $scope.cache.bookmarks = Delicious.load(username, function () {
            $scope.cache.lastUpdate = new Date().toJSON();
            DataStore.save(NAMESPACE_CACHE, $scope.cache);
        });
    };

    $scope.bookmarkCount = function () {
        return $scope.cache.bookmarks.length;
    };

    $scope.lastUpdate = function () {
        return moment(new Date($scope.cache.lastUpdate)).format('YYYY-MM-DD HH:mm:ss');
    };

    $scope.clear = function () {
        $scope.searchTerm = '';
    };

    $scope.init();
});
