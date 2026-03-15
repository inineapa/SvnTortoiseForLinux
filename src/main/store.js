const Store = require('electron-store').default || require('electron-store');

const store = new Store({
  name: 'svn-tortoise-config',
  defaults: {
    recentUrls: []
  }
});

function getRecentUrls() {
  return store.get('recentUrls', []);
}

function addUrl(url) {
  const urls = getRecentUrls();
  const filtered = urls.filter(u => u !== url);
  filtered.unshift(url);
  // Keep max 20 recent URLs
  const trimmed = filtered.slice(0, 20);
  store.set('recentUrls', trimmed);
  return trimmed;
}

function removeUrl(url) {
  const urls = getRecentUrls();
  const filtered = urls.filter(u => u !== url);
  store.set('recentUrls', filtered);
  return filtered;
}

module.exports = { getRecentUrls, addUrl, removeUrl };
