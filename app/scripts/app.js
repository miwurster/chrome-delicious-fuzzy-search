'use strict';

angular.module('delicious-fuzzy-search', [])

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
    }
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
  .run(['$rootScope', function ($rootScope) {
    $rootScope.app = {};
  }])

  /*
   * Top-level controller for the applicaiton
   */
  .controller('AppController', ['$scope', 'APP_KEY', 'REDIRECT_URL',
    function ($scope, APP_KEY, REDIRECT_URL) {
      $scope.app.urls = {
        oauth: 'https://delicious.com/auth/authorize?client_id=' + APP_KEY + '&redirect_uri=' + REDIRECT_URL,
        options: chrome.extension.getURL('options.html')
      };
    }])

  .controller('SettingsController', ['$scope', '$log', '$location', '$http', '$window', '$localstorage', 'STATE', 'APP_KEY', 'APP_KEY_SECRET',
    function ($scope, $log, $location, $http, $window, $localstorage, STATE, APP_KEY, APP_KEY_SECRET) {

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
        $http.post(url).
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
            $window.location = $scope.app.urls.options;
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

      function getOauthCode() {
        var match = $location.absUrl().match(/\?code=([a-zA-Z0-9]+)/);
        if (match !== null) {
          return match[1];
        }
        return undefined;
      }
    }]);
