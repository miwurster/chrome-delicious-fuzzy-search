'use strict';

angular.module('delicious-fuzzy-search', [
        'miwurster.base64',
        'miwurster.datastore'
    ])
    .run(['$rootScope', function ($rootScope) {
        $rootScope.CONST = {
            NAMESPACE_OPTIONS: 'dfs-options',
            SEARCH_DELAY: 300
        };
        $rootScope.utils = {
            isEmpty: function (text) {
                return (!text || 0 === text.length);
            },
            isBlank: function (text) {
                return (!text || /^\s*$/.test(text));
            }
        };
    }])
    .service('Delicious', [ '$http', 'Base64', function ($http, Base64) {
        var Delicious = {};
        Delicious.url = 'https://api.del.icio.us/v1/posts/all';
        Delicious.get = function (username, password, onSuccess, onError) {
            $http.defaults.headers.common.Authorization = 'Basic ' + Base64.encode(username + ':' + password);
            $http(
                {
                    method: 'GET',
                    url: Delicious.url,
                    transformResponse: function (data, headersGetter) {
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
                }
            ).success(onSuccess).error(onError);
            $http.defaults.headers.common.Authorization = '';
        };
        return Delicious;
    }]);