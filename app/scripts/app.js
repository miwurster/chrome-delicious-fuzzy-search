'use strict';

angular.module('delicious-fuzzy-search', [])

  .filter('domain', function () {
    return function (input) {
      var matches;
      var output = '';
      var urls = /\w+:\/\/([\w|\.]+)/;
      matches = urls.exec(input);
      if (matches !== null) {
        output = matches[1];
      }
      return output;
    };
  })

  .factory('$localstorage', ['$window', function ($window) {
    return {
      set: function (key, value) {
        if (value) {
          $window.localStorage[key] = value;
        } else {
          $window.localStorage.removeItem(key);
        }
      },
      get: function (key, defaultValue) {
        return $window.localStorage[key] || defaultValue;
      },
      setObject: function (key, value) {
        $window.localStorage[key] = JSON.stringify(value);
      },
      getObject: function (key) {
        return JSON.parse($window.localStorage[key] || '{}');
      }
    };
  }])

  .factory('$utils', function () {
    return {
      isEmpty: function (text) {
        return (!text || 0 === text.length);
      },
      isBlank: function (text) {
        return (!text || /^\s*$/.test(text));
      },
      isNumber: function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
      }
    };
  })

  .factory('$bookmarks', ['$log', '$http', '$q', '$localstorage',
    function ($log, $http, $q, $localstorage) {
      var accessToken = $localstorage.get('accessToken', undefined);

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
          $log.error('Could not parse received XML', JSON.stringify(e));
        }
        return posts;
      };

      return {
        getList: function () {
          if (!accessToken) {
            return $q.when(undefined);
          }
          $http.defaults.headers.common.Authorization = 'Bearer ' + accessToken;
          return $http.get('https://api.delicious.com/v1/posts/all');
        }
      };
    }])

  .constant('APP_KEY', '9bb4def552ddd6ec30f5427f2f29b162')
  .constant('APP_KEY_SECRET', '66b65558747ccc5c57d765ff2e1c9635')
  .constant('REDIRECT_URL', 'http://miwurster.github.io/chrome-delicious-fuzzy-search/robots.txt')
  .constant('SEARCH_DELAY', 300)
  .constant('STATE', {
    INCOMPLETE: 'INCOMPLETE',
    COMPLETE: 'COMPLETE',
    IN_PROGRESS: 'IN_PROGRESS',
    ERROR: 'ERROR'
  })

  /*
   * Ensure $http service uses its cache
   */
  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.defaults.cache = true;
  }])

  /*
   * Init rootScope
   */
  .run(['$rootScope', '$http', function ($rootScope, $http) {
    $rootScope.app = {};
    $http.get('manifest.json').success(function (data) {
      angular.extend($rootScope.app, data);
    });
  }])

  /*
   * Top-level controller for the applicaiton
   */
  .controller('AppController', ['$scope', '$window', 'APP_KEY', 'REDIRECT_URL',
    function ($scope, $window, APP_KEY, REDIRECT_URL) {

      $scope.app.urls = {
        oauth: 'https://delicious.com/auth/authorize?client_id=' + APP_KEY + '&redirect_uri=' + REDIRECT_URL,
        options: chrome.extension.getURL('options.html')
      };

      $scope.gotoSettings = function () {
        $window.location = $scope.app.urls.options;
      }
    }])

  .controller('SettingsController', ['$scope', '$log', '$location', '$http', '$localstorage', 'STATE', 'APP_KEY', 'APP_KEY_SECRET',
    function ($scope, $log, $location, $http, $localstorage, STATE, APP_KEY, APP_KEY_SECRET) {

      function getOauthCode() {
        var match = $location.absUrl().match(/\?code=([a-zA-Z0-9]+)/);
        if (match !== null) {
          return match[1];
        }
        return undefined;
      }

      $scope.STATE = STATE.INCOMPLETE;

      var oauthCode = getOauthCode();
      var accessToken = $localstorage.get('accessToken', undefined);

      if (oauthCode) {
        $scope.STATE = STATE.IN_PROGRESS;
      }

      if (angular.isString(accessToken)) {
        $scope.STATE = STATE.COMPLETE;
      }

      if ($scope.STATE === STATE.IN_PROGRESS) {
        var url = 'https://avosapi.delicious.com/api/v1/oauth/token?client_id=' +
          APP_KEY + '&client_secret=' + APP_KEY_SECRET + '&grant_type=code&code=' + oauthCode;
        $http.defaults.headers.common.Accept = 'application/json';
        $http.post(url, {}).
          success(function (data) {
            var status = data['status'];
            var accessToken = data['access_token'];
            if (status === 'success') {
              $scope.STATE = STATE.COMPLETE;
              $localstorage.set('accessToken', accessToken);
            } else {
              $scope.STATE = STATE.ERROR;
              $log.error('Could not request access token:', status, JSON.stringify(data));
            }
            $scope.gotoSettings();
          }).
          error(function (data, status, headers, config) {
            $scope.STATE = STATE.ERROR;
            $log.error('Error getting access token:', status);
            $log.debug(JSON.stringify(data));
            $log.debug(JSON.stringify(headers));
            $log.debug(JSON.stringify(config));
          });
      }

      $scope.resetSettings = function () {
        $localstorage.set('accessToken', undefined);
        $scope.STATE = STATE.INCOMPLETE;
      };

      $scope.closeSettings = function () {
        chrome.tabs.getCurrent(function (tab) {
          chrome.tabs.remove(tab.id);
        });
      };
    }])

  .controller('SearchController', ['$scope', '$log', 'STATE', '$utils', '$bookmarks', 'SEARCH_DELAY',
    function ($scope, $log, STATE, $utils, $bookmarks, SEARCH_DELAY) {

      $scope.STATE = STATE.INCOMPLETE;

      $scope.searchTerm = '';
      $scope.searchResult = [];

      var fuzzySearch = function (items, searchTerm) {
        if ($utils.isBlank(searchTerm)) {
          return [];
        }
        var options = {keys: ['description', 'tags']};
        var fuse = new Fuse(items, options);
        return _.uniq(fuse.search(searchTerm), true);
      };

      var inputListener = function () {
        $scope.searchResult = [];
        if ($utils.isBlank($scope.searchTerm)) {
          $scope.$apply();
          return;
        }
        $scope.STATE = STATE.IN_PROGRESS;
        $bookmarks.getList()
          .then(function (result) {
            if (result) {
              var bookmarks = result.data;
              $scope.searchResult = fuzzySearch(bookmarks, $scope.searchTerm);
              $scope.STATE = STATE.COMPLETE;
            } else {
              $scope.STATE = STATE.ERROR;
            }
          }, function () {
            $scope.searchResult = [];
            $scope.STATE = STATE.ERROR;
          });
      };

      $scope.$watch('searchTerm', _.debounce(inputListener, SEARCH_DELAY));
    }]);
