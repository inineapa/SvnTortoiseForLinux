const { contextBridge, ipcRenderer } = require('electron');
const hljs = require('highlight.js/lib/core');

// Register languages we need
hljs.registerLanguage('c', require('highlight.js/lib/languages/c'));
hljs.registerLanguage('bash', require('highlight.js/lib/languages/bash'));
hljs.registerLanguage('makefile', require('highlight.js/lib/languages/makefile'));
hljs.registerLanguage('plaintext', require('highlight.js/lib/languages/plaintext'));

contextBridge.exposeInMainWorld('svnApi', {
  info: (url) => ipcRenderer.invoke('svn:info', url),
  list: (url) => ipcRenderer.invoke('svn:list', url),
  log: (url, opts) => ipcRenderer.invoke('svn:log', url, opts),
  diff: (url, revision) => ipcRenderer.invoke('svn:diff', url, revision),
  diffFile: (url, revision, filePath) => ipcRenderer.invoke('svn:diffFile', url, revision, filePath),
  blame: (url, revision) => ipcRenderer.invoke('svn:blame', url, revision),
  cat: (url, revision) => ipcRenderer.invoke('svn:cat', url, revision)
});

contextBridge.exposeInMainWorld('storeApi', {
  getRecentUrls: () => ipcRenderer.invoke('store:getRecentUrls'),
  addUrl: (url) => ipcRenderer.invoke('store:addUrl', url),
  removeUrl: (url) => ipcRenderer.invoke('store:removeUrl', url)
});

contextBridge.exposeInMainWorld('hljs', {
  highlight: (code, options) => {
    try {
      const result = hljs.highlight(code, options);
      return { value: result.value };
    } catch (e) {
      return { value: code };
    }
  }
});
