'use strict';

angular.module('delicious-fuzzy-search', [
    'miwurster.utils', 'miwurster.simple-cache'
]);

angular.module('delicious-fuzzy-search')

    .constant('consts', {
        APP_KEY: '9bb4def552ddd6ec30f5427f2f29b162',
        APP_KEY_SECRET: '66b65558747ccc5c57d765ff2e1c9635',
        EXTENSION_ID: chrome.runtime.id,
        SEARCH_DELAY: 300
    })

    .config(['$httpProvider', function ($httpProvider) {
        //$httpProvider.defaults.withCredentials = true;
        /**
        $httpProvider.defaults.cache = true;
        $httpProvider.defaults.transformResponse = function (data) {
            var posts = [];
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
            return posts;
        }
        */
    }])

    .controller('options', ['$scope', '$log', '$http', 'consts', function ($scope, $log, $http, consts) {
        $scope.redirectUrl = 'chrome-extension://' + consts.EXTENSION_ID + '/options.html';
        // $scope.redirectUrl = 'http://miwurster.github.io/chrome-delicious-fuzzy-search';
        $scope.clientId = consts.APP_KEY;
        $scope.clientSecret = consts.APP_KEY_SECRET;

        var url = 'https://avosapi.delicious.com/api/v1/oauth/token'
            + '?client_id=' + consts.APP_KEY
            + '&client_secret=' + consts.APP_KEY_SECRET
            // + '&grant_type=code&code=' + oauthCode;
            + '&grant_type=credentials&username=miwurster&password=ttcyx18Mi';

        $http.defaults.headers.common.Accept = 'application/json';
        $http.post(url).
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
                $log.debug(JSON.stringify(config));
            });


//        $scope.accessToken = '7548957-672264c6df7fac333d0eede86d233599';
//
//        $http.defaults.headers.common.Authorization = 'Bearer ' + $scope.accessToken;
//        $http.get('https://api.del.icio.us/v1/posts/all').success(
//            function (data) {
//                console.log(JSON.stringify(data));
//            }
//        );
//        $http.defaults.headers.common.Authorization = '';
    }]);