// Fuzzy Search - types in active pane to filter and jump to matching items
const FuzzySearch = {
  active: false,
  query: '',
  modalEl: null,
  textEl: null,
  clearTimer: null,

  init() {
    this.modalEl = document.getElementById('fuzzy-search-modal');
    this.textEl = document.getElementById('fuzzy-search-text');
  },

  // Called from keyboard handler when a printable character is typed in a pane
  handleChar(char) {
    if (this.clearTimer) clearTimeout(this.clearTimer);

    this.query += char;
    this.active = true;
    this.textEl.textContent = this.query;
    this.modalEl.style.display = 'block';

    this.doSearch();

    // Auto-clear after 1.5s of no typing
    this.clearTimer = setTimeout(() => this.reset(), 1500);
  },

  handleBackspace() {
    if (!this.active || this.query.length === 0) return;
    if (this.clearTimer) clearTimeout(this.clearTimer);

    this.query = this.query.slice(0, -1);
    if (this.query.length === 0) {
      this.reset();
      return;
    }

    this.textEl.textContent = this.query;
    this.doSearch();

    this.clearTimer = setTimeout(() => this.reset(), 1500);
  },

  reset() {
    if (this.clearTimer) clearTimeout(this.clearTimer);
    this.active = false;
    this.query = '';
    this.modalEl.style.display = 'none';
    this.textEl.textContent = '';

    // Remove fuzzy hover highlights
    document.querySelectorAll('.fuzzy-hover').forEach(el => el.classList.remove('fuzzy-hover'));
  },

  // Confirm selection: make the fuzzy-hovered item the active selection
  confirm() {
    const hovered = document.querySelector('.fuzzy-hover');
    if (hovered) {
      hovered.click();
      hovered.classList.remove('fuzzy-hover');
    }
    this.reset();
  },

  doSearch() {
    const pane = App.activePane;
    if (!pane) return;

    // Remove old highlights
    document.querySelectorAll('.fuzzy-hover').forEach(el => el.classList.remove('fuzzy-hover'));

    const q = this.query.toLowerCase();

    if (pane === 'tree') {
      this._searchInContainer(
        TreeView.container,
        '.tree-node',
        el => {
          const label = el.querySelector('.tree-label');
          return label ? label.textContent : '';
        },
        q
      );
    } else if (pane === 'dir') {
      this._searchInContainer(
        DirListing.container,
        '.dir-entry:not(.type-up)',
        el => {
          const name = el.querySelector('.entry-name');
          return name ? name.textContent.replace(/\/$/, '') : '';
        },
        q
      );
    } else if (pane === 'logs') {
      this._searchInContainer(
        LogsPane.scrollWrapper,
        '.logs-table tbody tr',
        el => {
          const msgTd = el.querySelector('.col-msg');
          return msgTd ? msgTd.textContent : '';
        },
        q
      );
    } else if (pane === 'filelist') {
      this._searchInContainer(
        FileListPane.container,
        '.changed-file',
        el => {
          const pathEl = el.querySelector('.file-path');
          return pathEl ? pathEl.textContent : '';
        },
        q
      );
    }
  },

  _searchInContainer(container, selector, getText, query) {
    if (!container) return;
    const items = container.querySelectorAll(selector);
    for (const item of items) {
      const text = getText(item).toLowerCase();
      if (this._fuzzyMatch(text, query)) {
        item.classList.add('fuzzy-hover');
        item.scrollIntoView({ block: 'nearest' });
        return;
      }
    }
  },

  _fuzzyMatch(text, query) {
    let qi = 0;
    for (let ti = 0; ti < text.length && qi < query.length; ti++) {
      if (text[ti] === query[qi]) qi++;
    }
    return qi === query.length;
  }
};
