'use strict';

var NAMESPACE_CACHE = 'dfs-cache-dev';

chrome.omnibox.onInputChanged.addListener(function (text, suggest) {
    var bookmarks = DataStore.load(NAMESPACE_CACHE).bookmarks;

    var search = fuzzySearch(bookmarks, text);

    suggest(search);
});

chrome.omnibox.onInputEntered.addListener(function (text) {
    chrome.tabs.create({'url': text});
});

var DataStore = {
    load: function (namespace) {
        var result = localStorage.getItem(namespace);
        return (result && JSON.parse(result)) || {};
    },
    save: function (namespace, data) {
        localStorage.setItem(namespace, JSON.stringify(data));
    }
};

function fuzzySearch(items, searchTerm) {
    if (!searchTerm || /^\s*$/.test(searchTerm)) {
        return [];
    }

    var options = { keys: ['description', 'tags', 'url'] };
    var fuse = new Fuse(items, options);

    var result = [];
    _.each(_.uniq(fuse.search(searchTerm), true), function (value, key, list) {
        var item = {};
        item.content = value.url;
        item.description = '<match>' + _.escape(value.description) + '</match> <dim>[' + value.tags + ']</dim>';
        result.push(item);
    });

    return result;
}
