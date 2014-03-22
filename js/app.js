'use strict';

angular.module('delicious-fuzzy-search', ['ui.router', 'miwurster.utils']);

angular.module('delicious-fuzzy-search')

    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('site', {
                url: '/site',
                abstract: true,
                templateUrl: 'index.tpl.html'
            })
            .state('site.about', {
                url: '/about',
                views: {
                    'content': {
                        templateUrl: 'about.tpl.html'
                    }
                }
            });
        $urlRouterProvider.otherwise('/site/about');
    }]);