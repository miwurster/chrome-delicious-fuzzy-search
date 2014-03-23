'use strict';

angular.module('delicious-fuzzy-search', [
    'miwurster.utils', 'miwurster.simple-cache'
]);

angular.module('delicious-fuzzy-search')

    .constant('consts', {
        APP_KEY: '9bb4def552ddd6ec30f5427f2f29b162',
        APP_KEY_SECRET: '66b65558747ccc5c57d765ff2e1c9635',
        REDIRECT_URL: 'http://miwurster.github.io/chrome-delicious-fuzzy-search/robots.txt',
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

    .factory('oauthRequest', ['$location', function ($location) {
        var match = $location.absUrl().match(/\?code=([a-zA-Z0-9]+)/);
        if (match !== null) {
            return match[1];
        }
        return undefined;
    }])

    .controller('options', ['$scope', '$log', '$http', 'consts', 'datastore', 'oauthRequest',
        function ($scope, $log, $http, consts, datastore, oauthRequest) {
            $scope.href = {
                request: 'https://delicious.com/auth/authorize'
                    + '?client_id=' + consts.APP_KEY
                    + '&redirect_uri=' + consts.REDIRECT_URL
            };
            $scope.oauthCode = oauthRequest;
            $scope.accessToken = undefined;






//        datastore.put(consts.APP_KEY, {
//            accessToken: 'Foo'
//        });


            if (angular.isString($scope.accessToken)) {

            } else {

            }

            $scope.init = function () {
                var conf = datastore.get(consts.APP_KEY);
                $scope.accessToken = conf.accessToken;
            };
            $scope.reset = function () {
                datastore.remove(consts.APP_KEY);
                $scope.init();
            };
            $scope.init();

            /*
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
             */

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