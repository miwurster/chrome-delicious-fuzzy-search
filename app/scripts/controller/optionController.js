'use strict';

angular.module('delicious-fuzzy-search')
    .controller('OptionsController', [ '$scope', 'DataStore', function ($scope, DataStore) {
        $scope.data = {};
        $scope.data.username = '';
        $scope.data.password = '';

        $scope.init = function () {
            $scope.data = DataStore.load($scope.CONST.NAMESPACE_OPTIONS);
        };

        $scope.save = function () {
            DataStore.save($scope.CONST.NAMESPACE_OPTIONS, $scope.data);
        };

        $scope.init();
    }]);