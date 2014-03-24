'use strict';

angular.module('delicious-fuzzy-search', [
    'miwurster.utils', 'miwurster.simple-cache', 'miwurster.alert'
]);

angular.module('delicious-fuzzy-search')

    .constant('consts', {
        APP_KEY: '9bb4def552ddd6ec30f5427f2f29b162',
        APP_KEY_SECRET: '66b65558747ccc5c57d765ff2e1c9635',
        REDIRECT_URL: 'http://miwurster.github.io/chrome-delicious-fuzzy-search/robots.txt',
        SEARCH_DELAY: 300,
        MODE: {
            CONF_REQUIRED: 'conf_required',
            IN_PROGRESS: 'in_progress',
            COMPLETE: 'complete',
            ERROR: 'error'
        }
    })

    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.defaults.cache = true;
    }])

    .factory('oauthRequest', ['$location', function ($location) {
        var match = $location.absUrl().match(/\?code=([a-zA-Z0-9]+)/);
        if (match !== null) {
            return match[1];
        }
        return undefined;
    }])

    .factory('bookmarks', ['$log', '$http', '$q', 'consts', 'datastore', function ($log, $http, $q, consts, datastore) {
        var conf = datastore.get(consts.APP_KEY);
        $http.defaults.transformResponse = function (data) {
            var posts = [];
            try {
                var dom = $.parseXML(data);
                $(dom).find('post').each(function () {
                    var post = {};
                    post.description = $(this).attr('description');
                    post.url = $(this).attr('href');
                    post.tags = $(this).attr('tag');
                    if (0 === post.description.length) {
                        post.description = post.url;
                    }
                    posts.push(post);
                });
            } catch (e) {
                $log.error('Could not parse received XML');
            }
            return posts;
        };
        return {
            getList: function () {
                var accessToken = conf.accessToken;
                if (!accessToken) {
                    return $q.when(undefined);
                }
                $http.defaults.headers.common.Authorization = 'Bearer ' + accessToken;
                return $http.get('https://api.delicious.com/v1/posts/all');
            }
        };
    }])

    .run(['$rootScope', 'consts', function ($rootScope, consts) {
        $rootScope.href = {
            request: 'https://delicious.com/auth/authorize' +
                '?client_id=' + consts.APP_KEY +
                '&redirect_uri=' + consts.REDIRECT_URL,
            settings: function () {
                window.location = chrome.extension.getURL('options.html');
            }
        };
    }])

    .controller('tab', ['$scope', '$log', 'consts', 'bookmarks', 'utils',
        function ($scope, $log, consts, bookmarks, utils) {

            $scope.setupIncomplete = false;

            var fuzzySearch = function (items, searchTerm) {
                if (utils.isBlank(searchTerm)) {
                    return [];
                }

                var options = { keys: ['description', 'tags'] };
                var fuse = new Fuse(items, options);

                return _.uniq(fuse.search(searchTerm), true);
            };

            var inputListener = function () {
                $scope.searchResult = [];
                if (utils.isBlank($scope.searchTerm)) {
                    return;
                }
                $scope.progress = true;
                bookmarks.getList().then(function (result) {
                    if (result) {
                        var bookmarks = result.data;
                        $scope.searchResult = fuzzySearch(bookmarks, $scope.searchTerm);
                    } else {
                        $scope.setupIncomplete = true;
                    }
                    $scope.progress = false;
                }, function () {
                    $log.error('Error getting bookmarks');
                    $scope.searchResult = [];
                    $scope.progress = false;
                });
            };

            $scope.progress = false;

            $scope.searchTerm = '';
            $scope.searchResult = [];

            $scope.$watch('searchTerm', _.debounce(inputListener, consts.SEARCH_DELAY));
        }])

    .controller('options', ['$scope', '$log', '$http', 'consts', 'datastore', 'oauthRequest',
        function ($scope, $log, $http, consts, datastore, oauthRequest) {

            $scope.mode = consts.MODE.CONF_REQUIRED;

            $scope.init = function () {
                var conf = datastore.get(consts.APP_KEY);
                var accessToken = conf.accessToken;

                if (oauthRequest) {
                    $scope.mode = consts.MODE.IN_PROGRESS;
                }

                if (angular.isString(accessToken)) {
                    $scope.mode = consts.MODE.COMPLETE;
                }

                if ($scope.mode === consts.MODE.IN_PROGRESS) {
                    var url = 'https://avosapi.delicious.com/api/v1/oauth/token' +
                        '?client_id=' + consts.APP_KEY +
                        '&client_secret=' + consts.APP_KEY_SECRET +
                        '&grant_type=code&code=' + oauthRequest;
                    $http.defaults.headers.common.Accept = 'application/json';
                    $http.post(url).
                        success(function (data) {
                            var status = data.status;
                            var accessToken = data.access_token;
                            if (status === 'success') {
                                $scope.mode = consts.MODE.COMPLETE;
                                datastore.put(consts.APP_KEY, {
                                    accessToken: accessToken
                                });
                            } else {
                                $scope.mode = consts.MODE.ERROR;
                                $log.error('Could not request access token:', status);
                            }
                        }).
                        error(function (data, status, headers, config) {
                            $scope.mode = consts.MODE.ERROR;
                            $log.error('Error getting access token:', status);
                            $log.debug(JSON.stringify(config));
                        });
                }
            };

            $scope.reset = function () {
                datastore.remove(consts.APP_KEY);
                $scope.mode = consts.MODE.CONF_REQUIRED;
            };

            $scope.init();
        }]);