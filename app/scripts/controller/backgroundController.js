'use strict';

angular.module('delicious-fuzzy-search')
    .controller('BackgroundController', [ '$scope', 'DataStore', 'Delicious', function ($scope, DataStore, Delicious) {
        $scope.fuzzySearch = function (items, searchTerm) {
            var result = [];
            if ($scope.utils.isBlank(searchTerm)) {
                return result;
            }
            var options = { keys: ['description', 'tags', 'url'] };
            var fuse = new Fuse(items, options);
            _.each(_.uniq(fuse.search(searchTerm), true), function (value, key, list) {
                var item = {};
                item.content = value.url;
                item.description = '<match>' + _.escape(value.description) + '</match> <dim>[' + value.tags + ']</dim>';
                result.push(item);
            });
            return result;
        };
        $scope.inputListener = function (text, suggest) {
            console.log('Listener triggered...');
            var conf = DataStore.load($scope.CONST.NAMESPACE_OPTIONS);
            Delicious.get(
                conf.username,
                conf.password,
                function (data, status, headers, config) {
                    var result = $scope.fuzzySearch(data, text);
                    console.log('Result size: ' + result.length);
                    suggest(result);
                },
                function (data, status, headers, config) {
                    console.log('Error getting data from Delicious API. HTTP Code: ' + status);
                }
            );
        };
        $scope.openOrFocusOptionsPage = function () {
            var optionsUrl = chrome.extension.getURL('options.html');
            chrome.tabs.query({}, function (extensionTabs) {
                var found = false;
                for (var i = 0; i < extensionTabs.length; i++) {
                    if (optionsUrl === extensionTabs[i].url) {
                        console.log('Option page already active, focus tab ' + extensionTabs[i].id);
                        found = true;
                        chrome.tabs.update(extensionTabs[i].id, {'selected': true});
                    }
                }
                if (!found) {
                    chrome.tabs.create({url: 'options.html'});
                }
            });
        };
        $scope.init = function () {
            chrome.omnibox.onInputChanged.addListener(_.debounce($scope.inputListener, 500));
            chrome.omnibox.onInputEntered.addListener(function (text) {
                chrome.tabs.create({'url': text});
            });
            chrome.browserAction.onClicked.addListener(function (tab) {
                $scope.openOrFocusOptionsPage();
            });
            chrome.extension.onConnect.addListener(function (port) {
                var tab = port.sender.tab;
                port.onMessage.addListener(function (info) {
                    var maxLength = 1024;
                    if (info.selection.length > maxLength) {
                        info.selection = info.selection.substring(0, maxLength);
                    }
                    $scope.openOrFocusOptionsPage();
                });
            });
        };
        $scope.init();
    }]);