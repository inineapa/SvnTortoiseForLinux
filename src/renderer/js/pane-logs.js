// LOGS Pane
const LogsPane = {
  tbody: null,
  logs: [],
  selectedRevision: null,
  pathInput: null,
  authorInput: null,
  keywordInput: null,
  autocompleteEl: null,
  autocompleteCache: {},
  autocompleteActiveIdx: -1,
  isFetching: false,
  hasMore: true,
  batchSize: 100,
  scrollWrapper: null,
  loadingMoreEl: null,

  // Author background colors (subtle, 20 distinct)
  authorColors: [
    'rgba(0, 120, 215, 0.10)',
    'rgba(215, 60, 0, 0.10)',
    'rgba(0, 160, 80, 0.10)',
    'rgba(160, 80, 200, 0.10)',
    'rgba(200, 160, 0, 0.10)',
    'rgba(0, 160, 160, 0.10)',
    'rgba(200, 0, 100, 0.10)',
    'rgba(80, 120, 0, 0.10)',
    'rgba(100, 60, 180, 0.10)',
    'rgba(0, 100, 140, 0.10)',
    'rgba(180, 100, 40, 0.10)',
    'rgba(60, 160, 120, 0.10)',
    'rgba(180, 40, 60, 0.10)',
    'rgba(100, 140, 200, 0.10)',
    'rgba(140, 100, 60, 0.10)',
    'rgba(60, 100, 160, 0.10)',
    'rgba(160, 120, 80, 0.10)',
    'rgba(80, 160, 40, 0.10)',
    'rgba(200, 80, 160, 0.10)',
    'rgba(40, 140, 100, 0.10)',
  ],
  authorColorMap: new Map(),
  authorColorIdx: 0,

  init() {
    this.tbody = document.getElementById('logs-tbody');
    this.pathInput = document.getElementById('filter-path');
    this.authorInput = document.getElementById('filter-author');
    this.keywordInput = document.getElementById('filter-keyword');
    this.autocompleteEl = document.getElementById('path-autocomplete');

    document.getElementById('btn-search').addEventListener('click', () => this.search());
    document.getElementById('btn-clear').addEventListener('click', () => this.clearFilters());

    // Enter key triggers search (author/keyword only - path has its own handler)
    [this.authorInput, this.keywordInput].forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.search();
        }
      });
    });

    // Path input keyboard: autocomplete navigation + enter/tab
    this.pathInput.addEventListener('keydown', (e) => {
      const visible = this.autocompleteEl.style.display !== 'none';
      const items = this.autocompleteEl.querySelectorAll('.autocomplete-item');

      if (visible && items.length > 0) {
        if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'j')) {
          e.preventDefault();
          this.autocompleteActiveIdx = Math.min(this.autocompleteActiveIdx + 1, items.length - 1);
          this._updateAutocompleteActive(items);
          return;
        }
        if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'k')) {
          e.preventDefault();
          this.autocompleteActiveIdx = Math.max(this.autocompleteActiveIdx - 1, 0);
          this._updateAutocompleteActive(items);
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          if (this.autocompleteActiveIdx >= 0 && this.autocompleteActiveIdx < items.length) {
            items[this.autocompleteActiveIdx].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          } else if (items.length > 0) {
            items[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          }
          return;
        }
      }

      if (e.key === 'Enter') {
        this.autocompleteEl.style.display = 'none';
        this.search();
      }
      if (e.key === 'Escape') {
        this.autocompleteEl.style.display = 'none';
        this.autocompleteActiveIdx = -1;
      }
    });

    // Path autocomplete
    this.pathInput.addEventListener('input', Utils.debounce(() => {
      this.showAutocomplete();
    }, 300));

    this.pathInput.addEventListener('blur', () => {
      setTimeout(() => {
        this.autocompleteEl.style.display = 'none';
      }, 200);
    });

    // Setup scroll indicators and infinite scroll
    // Split table: thead stays fixed outside scroll, tbody scrolls with fade
    const tableContainer = document.querySelector('.logs-table-container');
    const table = tableContainer.querySelector('.logs-table');
    const thead = table.querySelector('thead');
    const topInd = tableContainer.querySelector('.pane-scroll-indicator.top');
    const botInd = tableContainer.querySelector('.pane-scroll-indicator.bottom');

    // Create a separate header table that stays outside the scroll area
    const headerTable = document.createElement('table');
    headerTable.className = 'logs-table logs-table-header';
    headerTable.appendChild(thead);
    tableContainer.insertBefore(headerTable, table);

    // Wrap the body table in the scroll wrapper
    this.scrollWrapper = document.createElement('div');
    this.scrollWrapper.className = 'pane-content-scroll';
    table.parentNode.insertBefore(this.scrollWrapper, table);
    this.scrollWrapper.appendChild(table);

    Utils.setupScrollIndicators(this.scrollWrapper, topInd, botInd);

    // Infinite scroll: fetch more when near bottom
    this.scrollWrapper.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = this.scrollWrapper;
      if (scrollHeight - scrollTop - clientHeight < 200) {
        this.fetchMore();
      }
    });

    // Loading-more spinner element (appended after the table)
    this.loadingMoreEl = document.createElement('div');
    this.loadingMoreEl.className = 'logs-loading-more';
    this.loadingMoreEl.style.display = 'none';
    this.loadingMoreEl.innerHTML = '<div class="mini-spinner"></div> Loading more...';
    this.scrollWrapper.appendChild(this.loadingMoreEl);

    // Setup resizable column headers
    this._setupColumnResize();

    // Calculate batch size based on visible area (5x visible rows)
    requestAnimationFrame(() => {
      const h = this.scrollWrapper.clientHeight || 300;
      const rowH = 25;
      this.batchSize = Math.max(100, Math.floor((h / rowH) * 5));
    });
  },

  _setupColumnResize() {
    const ths = document.querySelectorAll('.logs-table thead th');
    ths.forEach((th, i) => {
      // Don't resize last column (msg takes remaining space)
      if (i === ths.length - 1) return;

      const handle = document.createElement('div');
      handle.className = 'col-resize-handle';
      th.appendChild(handle);

      let startX, startWidth;
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startX = e.clientX;
        startWidth = th.getBoundingClientRect().width;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const onMove = (ev) => {
          const delta = ev.clientX - startX;
          const newWidth = Math.max(40, startWidth + delta);
          th.style.width = newWidth + 'px';
          // Apply to matching td cells via class
          const cls = th.className.replace('col-resize-handle', '').trim().split(/\s+/)[0];
          if (cls) {
            this.tbody.closest('table').querySelectorAll('td.' + cls).forEach(td => {
              td.style.width = newWidth + 'px';
            });
          }
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  },

  async loadInitial() {
    this.hasMore = true;
    this.logs = [];
    this.selectedRevision = null;
    this.authorColorMap = new Map();
    this.authorColorIdx = 0;
    try {
      const logs = await window.svnApi.log(App.repoUrl, { limit: this.batchSize });
      this.logs = logs;
      this.hasMore = logs.length >= this.batchSize;
      this.render();
    } catch (err) {
      this.tbody.innerHTML = `<tr><td colspan="4" style="color:var(--danger);padding:12px;">Error loading logs: ${Utils.escapeHtml(err.message)}</td></tr>`;
    }
  },

  async fetchMore() {
    if (this.isFetching || !this.hasMore || this.logs.length === 0) return;
    this.isFetching = true;
    this.loadingMoreEl.style.display = 'flex';

    const lastRev = this.logs[this.logs.length - 1].revision;
    const startRev = parseInt(lastRev) - 1;
    if (startRev < 1) { this.hasMore = false; this.isFetching = false; this.loadingMoreEl.style.display = 'none'; return; }

    try {
      let url = App.repoUrl;
      const pathFilter = this.pathInput.value.trim();
      if (pathFilter) url = App.repoUrl + '/' + pathFilter.replace(/^\//, '');

      const opts = { limit: this.batchSize, startRevision: startRev };
      const keywordFilter = this.keywordInput.value.trim();
      if (keywordFilter) opts.search = keywordFilter;

      let newLogs = await window.svnApi.log(url, opts);

      // Client-side author filter
      const authorFilter = this.authorInput.value.trim();
      if (authorFilter) {
        const authorLower = authorFilter.toLowerCase();
        newLogs = newLogs.filter(l => l.author.toLowerCase().includes(authorLower));
      }

      if (newLogs.length === 0) {
        this.hasMore = false;
      } else {
        this.hasMore = newLogs.length >= this.batchSize;
        this.logs.push(...newLogs);
        this.appendRows(newLogs);
      }
    } catch (err) {
      this.hasMore = false;
    } finally {
      this.isFetching = false;
      this.loadingMoreEl.style.display = 'none';
    }
  },

  async search() {
    const pathFilter = this.pathInput.value.trim();
    const authorFilter = this.authorInput.value.trim();
    const keywordFilter = this.keywordInput.value.trim();

    this.hasMore = true;

    Utils.showLoading();
    try {
      let url = App.repoUrl;
      if (pathFilter) {
        url = App.repoUrl + '/' + pathFilter.replace(/^\//, '');
      }

      const opts = { limit: this.batchSize };
      if (keywordFilter) opts.search = keywordFilter;

      let logs = await window.svnApi.log(url, opts);

      if (authorFilter) {
        const authorLower = authorFilter.toLowerCase();
        logs = logs.filter(l => l.author.toLowerCase().includes(authorLower));
      }

      this.logs = logs;
      this.hasMore = logs.length >= this.batchSize;
      this.selectedRevision = null;
      this.authorColorMap = new Map();
      this.authorColorIdx = 0;
      this.render();
      FileListPane.clear();
    } catch (err) {
      this.tbody.innerHTML = `<tr><td colspan="4" style="color:var(--danger);padding:12px;">Error: ${Utils.escapeHtml(err.message)}</td></tr>`;
    } finally {
      Utils.hideLoading();
    }
  },

  clearFilters() {
    this.pathInput.value = '';
    this.authorInput.value = '';
    this.keywordInput.value = '';
    this.selectedRevision = null;
    FileListPane.clear();
    this.loadInitial();
  },

  showLogsForPath(path) {
    this.authorInput.value = '';
    this.keywordInput.value = '';
    this.pathInput.value = path;
    App.setActivePane('logs');
    this.search();
  },

  async showAutocomplete() {
    const value = this.pathInput.value.trim();
    if (!value) {
      this.autocompleteEl.style.display = 'none';
      return;
    }

    const parts = value.split('/');
    const partial = parts.pop();
    const dirPath = parts.join('/');
    const dirUrl = dirPath ? App.repoUrl + '/' + dirPath : App.repoUrl;

    try {
      let entries;
      if (this.autocompleteCache[dirUrl]) {
        entries = this.autocompleteCache[dirUrl];
      } else {
        entries = await window.svnApi.list(dirUrl);
        this.autocompleteCache[dirUrl] = entries;
      }

      const matches = entries.filter(e =>
        e.name.toLowerCase().startsWith(partial.toLowerCase())
      ).slice(0, 15);

      if (matches.length === 0) {
        this.autocompleteEl.style.display = 'none';
        return;
      }

      this.autocompleteEl.innerHTML = '';
      this.autocompleteActiveIdx = -1;
      matches.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        const fullPath = dirPath
          ? dirPath + '/' + entry.name + (entry.kind === 'dir' ? '/' : '')
          : entry.name + (entry.kind === 'dir' ? '/' : '');
        const iconSvg = FileIcons.getIcon(entry.name, entry.kind);
        item.innerHTML = iconSvg + ' ' + Utils.escapeHtml(fullPath);
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.pathInput.value = fullPath;
          this.autocompleteEl.style.display = 'none';
          if (entry.kind === 'dir') {
            setTimeout(() => this.showAutocomplete(), 100);
          }
        });
        this.autocompleteEl.appendChild(item);
      });
      this.autocompleteEl.style.display = 'block';
    } catch (err) {
      this.autocompleteEl.style.display = 'none';
    }
  },

  _updateAutocompleteActive(items) {
    items.forEach((item, i) => {
      item.classList.toggle('active', i === this.autocompleteActiveIdx);
    });
    if (this.autocompleteActiveIdx >= 0 && items[this.autocompleteActiveIdx]) {
      items[this.autocompleteActiveIdx].scrollIntoView({ block: 'nearest' });
    }
  },

  render() {
    this.tbody.innerHTML = '';
    if (this.logs.length === 0) {
      this.tbody.innerHTML = '<tr><td colspan="4" style="padding:12px;color:var(--text-secondary);">No log entries found.</td></tr>';
      return;
    }

    this.logs.forEach((log, i) => {
      const tr = this._createLogRow(log, i);
      this.tbody.appendChild(tr);
    });
  },

  appendRows(newLogs) {
    const startIdx = this.logs.length - newLogs.length;
    newLogs.forEach((log, i) => {
      const tr = this._createLogRow(log, startIdx + i);
      this.tbody.appendChild(tr);
    });
  },

  _getAuthorColor(author) {
    if (!this.authorColorMap.has(author)) {
      this.authorColorMap.set(author, this.authorColors[this.authorColorIdx % this.authorColors.length]);
      this.authorColorIdx++;
    }
    return this.authorColorMap.get(author);
  },

  _createLogRow(log, index) {
    const tr = document.createElement('tr');
    tr.dataset.logIndex = index;
    if (log.revision === this.selectedRevision) {
      tr.classList.add('selected-item');
    }

    const bgColor = this._getAuthorColor(log.author);
    tr.innerHTML = `
      <td class="col-rev" style="background-color:${bgColor}">r${Utils.escapeHtml(String(log.revision))}</td>
      <td class="col-author" style="background-color:${bgColor}">${Utils.escapeHtml(log.author)}</td>
      <td class="col-date" style="background-color:${bgColor}">${Utils.formatDateFull(log.date)}</td>
      <td class="col-msg">${Utils.escapeHtml(Utils.truncate(log.msg, 80))}</td>
    `;

    tr.addEventListener('click', () => {
      this.selectLog(log, tr);
    });

    tr.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.selectLog(log, tr);
      ContextMenu.show(e.clientX, e.clientY, [
        {
          label: 'Show diff for this commit',
          action: () => App.openDiffView(log.revision)
        }
      ]);
    });

    return tr;
  },

  selectLog(log, trEl) {
    this.selectedRevision = log.revision;

    this.tbody.querySelectorAll('.selected-item').forEach(el => el.classList.remove('selected-item'));
    trEl.classList.add('selected-item');

    FileListPane.showCommit(log);

    App.setActivePane('logs');
  }
};
