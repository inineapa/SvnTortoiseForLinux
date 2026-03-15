// View 1: Repository Selector
const RepoSelector = {
  urlInput: null,
  recentList: null,
  dropdownOpen: false,

  init() {
    this.urlInput = document.getElementById('repo-url-input');
    this.recentList = document.getElementById('recent-list');

    document.getElementById('combo-toggle').addEventListener('click', () => {
      this.toggleDropdown();
    });

    document.getElementById('btn-select').addEventListener('click', () => {
      this.selectRepo();
    });

    document.getElementById('selector-close').addEventListener('click', () => {
      window.close();
    });

    this.urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.selectRepo();
      }
    });

    this.urlInput.addEventListener('focus', () => {
      // Close dropdown when user starts typing
      if (this.dropdownOpen) {
        this.closeDropdown();
      }
    });

    this.loadRecentUrls();
  },

  async loadRecentUrls() {
    try {
      const urls = await window.storeApi.getRecentUrls();
      this.renderRecentList(urls);
      if (urls.length > 0 && !this.urlInput.value) {
        this.urlInput.value = urls[0];
        this.urlInput.select();
      }
    } catch (err) {
      console.error('Failed to load recent URLs:', err);
    }
  },

  renderRecentList(urls) {
    this.recentList.innerHTML = '';
    if (urls.length === 0) {
      this.recentList.innerHTML = '<div style="padding:8px;color:var(--text-secondary);font-size:12px;">No recent repositories</div>';
      return;
    }
    urls.forEach(url => {
      const item = document.createElement('div');
      item.className = 'recent-item';

      const urlText = document.createElement('span');
      urlText.className = 'url-text';
      urlText.textContent = url;
      urlText.addEventListener('click', () => {
        this.urlInput.value = url;
        this.closeDropdown();
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.textContent = '\u00D7';
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const updated = await window.storeApi.removeUrl(url);
        this.renderRecentList(updated);
      });

      item.appendChild(urlText);
      item.appendChild(deleteBtn);
      this.recentList.appendChild(item);
    });
  },

  toggleDropdown() {
    if (this.dropdownOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  },

  openDropdown() {
    this.recentList.style.display = 'block';
    this.dropdownOpen = true;
    this.loadRecentUrls();
  },

  closeDropdown() {
    this.recentList.style.display = 'none';
    this.dropdownOpen = false;
  },

  async selectRepo() {
    const url = this.urlInput.value.trim();
    const errorEl = document.getElementById('selector-error');

    if (!url) {
      errorEl.textContent = 'Please enter a repository URL.';
      return;
    }

    errorEl.textContent = '';
    Utils.showLoading();

    try {
      const info = await window.svnApi.info(url);
      await window.storeApi.addUrl(url);
      App.openMainView(url, info);
    } catch (err) {
      errorEl.textContent = 'Failed to connect: ' + err.message;
    } finally {
      Utils.hideLoading();
    }
  }
};
