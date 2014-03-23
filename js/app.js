'use strict';

angular.module('delicious-fuzzy-search', ['ui.router', 'miwurster.utils', 'miwurster.alert']);

angular.module('delicious-fuzzy-search')

    .constant('consts', {
        APP_KEY: '9bb4def552ddd6ec30f5427f2f29b162',
        APP_KEY_SECRET: '66b65558747ccc5c57d765ff2e1c9635',
        REDIRECT_URL: 'http://miwurster.github.io/chrome-delicious-fuzzy-search'
        // REDIRECT_URL: 'http://delicious-fuzzy-search.miwurster.com'
        // REDIRECT_URL: 'http://localhost/dfs-page'
    })

    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('site', {
                url: '/site',
                abstract: true,
                controller: 'site',
                templateUrl: 'index.tpl.html'
            })
            .state('site.about', {
                url: '/about',
                views: {
                    'content': {
                        templateUrl: 'about.tpl.html'
                    }
                }
            })
            .state('site.delicious', {
                url: '/delicious',
                views: {
                    'content': {
                        controller: 'delicious',
                        templateUrl: 'delicious.tpl.html'
                    }
                },
                resolve: {
                    oauthCode: function ($location) {
                        var oauth = $location.absUrl().match(/\/\?code=([a-zA-Z0-9]+)/);
                        if (oauth !== null) {
                            return oauth[1];
                        }
                        return undefined;
                    }
                }
            });
        $urlRouterProvider.otherwise('/site/about');
    }])

    .run(['$rootScope', '$location', '$state', function ($rootScope, $location, $state) {
        $rootScope.$on('$stateChangeStart', function (event, next) {
            var redirected = $location.absUrl().match(/\/\?code=([a-zA-Z0-9]+)/);
            if (redirected !== null && next.name === 'site.about') {
                event.preventDefault();
                $state.go('site.delicious');
            }
        });
    }])

    .controller('site', ['$scope', 'consts', function ($scope, consts) {
        $scope.home_url = consts.REDIRECT_URL;
        $scope.request_url = 'https://delicious.com/auth/authorize'
            + '?client_id=' + consts.APP_KEY
            + '&redirect_uri=' + consts.REDIRECT_URL;
    }])

    .controller('delicious', ['$scope', '$log', '$http', '$state', 'consts', 'oauthCode',
        function ($scope, $log, $http, $state, consts, oauthCode) {
            if (!oauthCode) {
                $state.go('site.about');
            }
            var oauthUrl = 'http://avosapi.delicious.com/api/v1/oauth/token'
                + '?client_id=' + consts.APP_KEY
                + '&client_secret=' + consts.APP_KEY_SECRET
                + '&grant_type=code&code=' + oauthCode;

            $http.defaults.headers.common.Accept = 'application/json';
            $http.post(oauthUrl).
                success(function (data) {
                    var status = data.status;
                    var accessToken = data.access_token;
                    if (status === 'success') {
                        $scope.accessToken = accessToken;
                    } else {
                        $scope.error = { code: status };
                        $log.error('Could not request access token:', status);
                    }
                }).
                error(function (data, status, headers, config) {
                    $log.error('Error getting access token:', status);
                    $log.error(JSON.stringify(data), JSON.stringify(headers), JSON.stringify(config));
                });
        }]);