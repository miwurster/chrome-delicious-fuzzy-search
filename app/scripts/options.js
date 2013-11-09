'use strict';

var NAMESPACE_OPTIONS = 'dfs-options';
var NAMESPACE_CACHE = 'dfs-cache';

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

module.factory('Base64', function () {
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    function utf8_encode(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }

        return utftext;
    }

    function utf8_decode(utftext) {
        var string = "";
        var i = 0;
        var c = 0;
        var c2 = 0;
        var c3 = 0;

        while (i < utftext.length) {
            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }

        return string;
    }

    return {
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;

            input = utf8_encode(input);

            while (i < input.length) {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                    keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) + keyStr.charAt(enc4);
            }

            return output;
        },

        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;

            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            while (i < input.length) {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

            }

            output = utf8_decode(output);

            return output;
        }
    }
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

module.factory('Delicious', [ '$http', 'Base64', function ($http, Base64) {
    var Delicious = {};

    Delicious.url = 'https://api.del.icio.us/v1/posts/all';

    Delicious.get = function (username, password, onSuccess, onError) {
        var result = [];

        $http.defaults.headers.common.Authorization = 'Basic ' + Base64.encode(username + ':' + password);
        $http({
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
            }}).
            success(onSuccess).
            error(onError);
        $http.defaults.headers.common.Authorization = '';

        return result;
    };

    return Delicious;
}]);

module.filter('fuzzyFilter', function () {
    return function (items, searchTerm) {

        if (!searchTerm || /^\s*$/.test(searchTerm)) {
            return items;
        }

        var options = { keys: ['description', 'tags'] };
        var fuse = new Fuse(items, options);

        return _.uniq(fuse.search(searchTerm), true);
    }
});

module.filter('tokenize', function () {
    return function (item) {
        return item.split(' ');
    }
});

module.controller('OptionsController', function ($scope, DataStore) {
    $scope.data = {};
    $scope.data.username = '';
    $scope.data.password = '';

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

        if (!$scope.cache.bookmarks) {
            $scope.cache.bookmarks = [];
        }
    };

    $scope.refresh = function () {
        console.log('Refreshing data...');

        var conf = DataStore.load(NAMESPACE_OPTIONS);
        Delicious.get(
            conf.username,
            conf.password,
            function (data, status, headers, config) {
                $scope.cache.bookmarks = data;
                $scope.cache.lastUpdate = new Date().toJSON();

                DataStore.save(NAMESPACE_CACHE, $scope.cache);
            },
            function (data, status, headers, config) {
                console.log('Error getting data from Delicious API. HTTP Code: ' + status);
            }
        );
    };

    $scope.bookmarkCount = function () {
        if (!$scope.cache.bookmarks) {
            return 0;
        }
        return $scope.cache.bookmarks.length;
    };

    $scope.lastUpdate = function () {
        if (!$scope.cache.lastUpdate) {
            return undefined;
        }
        return moment(new Date($scope.cache.lastUpdate)).format('YYYY-MM-DD HH:mm:ss');
    };

    $scope.clear = function () {
        $scope.searchTerm = '';
    };

    $scope.init();
});
