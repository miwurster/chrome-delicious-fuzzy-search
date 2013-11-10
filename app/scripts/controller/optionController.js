'use strict';

angular.module('delicious-fuzzy-search')
    .controller('OptionsController', [ '$scope', 'DataStore', function ($scope, DataStore) {
        $scope.cache = {};
        $scope.username = '';
        $scope.password = '';

        $scope.init = function () {
            $scope.cache = DataStore.load($scope.CONST.NAMESPACE_OPTIONS);
            if (!$scope.isCacheEmpty()) {
                $scope.username = $scope.cache.username;
                $scope.password = $scope.cache.password;
            }
        };

        $scope.save = function () {
            $scope.cache.username = $scope.username;
            $scope.cache.password = $scope.password;
            DataStore.save($scope.CONST.NAMESPACE_OPTIONS, $scope.cache);
        };

        $scope.resetCredentials = function () {
            $scope.cache = {};
            $scope.username = '';
            $scope.password = '';
            $scope.save();
        };

        $scope.isCacheEmpty = function () {
            return _.isEmpty($scope.cache) || _.isEmpty($scope.cache.username) || _.isEmpty($scope.cache.password);
        };

        $scope.init();
    }]);