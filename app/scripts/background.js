'use strict';

function focusOrCreateTab(url) {
  chrome.windows.getAll({'populate': true}, function (windows) {
    var existingTab;
    for (var i in windows) {
      if (windows.hasOwnProperty(i)) {
        var tabs = windows[i].tabs;
        for (var j in tabs) {
          if (tabs.hasOwnProperty(j)) {
            var tab = tabs[j];
            if (tab.url === url) {
              existingTab = tab;
              break;
            }
          }
        }
      }
    }
    if (existingTab) {
      chrome.tabs.update(existingTab.id, {'selected': true});
    } else {
      chrome.tabs.create({'url': url, 'selected': true});
    }
  });
}

chrome.browserAction.onClicked.addListener(function () {
  var url = chrome.extension.getURL('search.html');
  focusOrCreateTab(url);
});
