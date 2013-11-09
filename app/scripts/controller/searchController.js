'use strict';

angular.module('delicious-fuzzy-search')
    .controller('SearchController', [ '$scope', 'DataStore', 'Delicious', function ($scope, DataStore, Delicious) {
        var fuzzySearch = function (items, searchTerm) {
            if ($scope.utils.isBlank(searchTerm)) {
                return [];
            }
            var options = { keys: ['description', 'tags'] };
            var fuse = new Fuse(items, options);
            return _.uniq(fuse.search(searchTerm), true);
        };
        $scope.inProgress = false;
        $scope.searchTerm = '';
        $scope.searchResult = [];
        $scope.inputListener = function () {
            console.log('Listener triggered...');
            if ($scope.utils.isBlank($scope.searchTerm)) {
                console.log('Empty search term; do nothing!');
                $scope.searchResult = [];
                return;
            }
            $scope.inProgress = true;
            var conf = DataStore.load($scope.CONST.NAMESPACE_OPTIONS);
            Delicious.get(
                conf.username,
                conf.password,
                function (data, status, headers, config) {
                    $scope.searchResult = fuzzySearch(data, $scope.searchTerm);
                    $scope.inProgress = false;
                },
                function (data, status, headers, config) {
                    console.log('Error getting data from Delicious API. HTTP Code: ' + status);
                    $scope.searchResult = [];
                    $scope.inProgress = false;
                }
            );
        };
        $scope.resetSearch = function () {
            $scope.searchTerm = '';
            $scope.searchResult = [];
        };
        $scope.init = function () {
            $scope.$watch('searchTerm', _.debounce($scope.inputListener, 300));
        };
        $scope.init();
    }]);