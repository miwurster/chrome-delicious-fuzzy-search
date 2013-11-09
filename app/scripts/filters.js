'use strict';

angular.module('delicious-fuzzy-search', [])
    .filter('fuzzyFilter', function () {
        return function (items, searchTerm) {

            if (!searchTerm || /^\s*$/.test(searchTerm)) {
                return items;
            }

            var options = { keys: ['description', 'tags'] };
            var fuse = new Fuse(items, options);

            return _.uniq(fuse.search(searchTerm), true);
        };
    })
    .filter('tokenize', function () {
        return function (item) {
            return item.split(' ');
        };
    });