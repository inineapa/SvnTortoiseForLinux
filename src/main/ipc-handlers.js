const { ipcMain } = require('electron');
const svnService = require('./svn-service');
const store = require('./store');

function registerIpcHandlers() {
  ipcMain.handle('svn:info', async (event, url) => {
    return svnService.svnInfo(url);
  });

  ipcMain.handle('svn:list', async (event, url) => {
    return svnService.svnList(url);
  });

  ipcMain.handle('svn:log', async (event, url, opts) => {
    return svnService.svnLog(url, opts);
  });

  ipcMain.handle('svn:diff', async (event, url, revision) => {
    return svnService.svnDiff(url, revision);
  });

  ipcMain.handle('svn:diffFile', async (event, url, revision, filePath) => {
    return svnService.svnDiffFile(url, revision, filePath);
  });

  ipcMain.handle('svn:blame', async (event, url, revision) => {
    return svnService.svnBlameWithContent(url, revision);
  });

  ipcMain.handle('svn:cat', async (event, url, revision) => {
    return svnService.svnCat(url, revision);
  });

  ipcMain.handle('store:getRecentUrls', async () => {
    return store.getRecentUrls();
  });

  ipcMain.handle('store:addUrl', async (event, url) => {
    return store.addUrl(url);
  });

  ipcMain.handle('store:removeUrl', async (event, url) => {
    return store.removeUrl(url);
  });
}

module.exports = { registerIpcHandlers };
