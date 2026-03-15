// Main App - View router and global state
const App = {
  currentView: 'view-repo-selector',
  repoUrl: '',
  repoRoot: '', // SVN repository root URL (for constructing full file URLs)
  repoInfo: null,
  activePane: null,

  init() {
    ContextMenu.init();
    RepoSelector.init();
    MainView.init();
    TreeView.init();
    DirListing.init();
    LogsPane.init();
    FileListPane.init();
    DiffView.init();
    BlameView.init();
    FuzzySearch.init();
    this._setupKeyboard();
  },

  _setupKeyboard() {
    // Ctrl+C cancels loading overlay (works globally)
    // Escape navigates back in all views
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'c') {
        const loadingEl = document.getElementById('loading');
        if (loadingEl && loadingEl.style.display !== 'none') {
          e.preventDefault();
          Utils.cancelLoading();
          return;
        }
      }
      if (e.key === 'Escape') {
        // Dismiss fuzzy search first
        if (FuzzySearch.active) {
          FuzzySearch.reset();
          return;
        }
        // Close autocomplete if visible
        const ac = document.getElementById('path-autocomplete');
        if (ac && ac.style.display !== 'none') {
          ac.style.display = 'none';
          return;
        }
        // Blur focused inputs first
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
          document.activeElement.blur();
          return;
        }
        // Navigate back based on current view
        if (this.currentView === 'view-diff' || this.currentView === 'view-blame') {
          e.preventDefault();
          App.switchView('view-main');
          return;
        }
        if (this.currentView === 'view-main') {
          e.preventDefault();
          App.switchView('view-repo-selector');
          return;
        }
      }
    });

    // Click on loading overlay to cancel
    document.getElementById('loading').addEventListener('click', () => {
      Utils.cancelLoading();
    });

    document.addEventListener('keydown', (e) => {
      // Only handle keys when main view is active and no input is focused
      if (this.currentView !== 'view-main') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        this._navigateRow(e.key === 'ArrowUp' ? -1 : 1);
        return;
      }

      if (e.key === 'Escape') {
        return;
      }

      if (e.key === 'Enter') {
        if (FuzzySearch.active) {
          FuzzySearch.confirm();
        }
        return;
      }

      if (e.key === 'Backspace') {
        if (FuzzySearch.active) {
          FuzzySearch.handleBackspace();
        }
        return;
      }

      // Printable character -> fuzzy search
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        FuzzySearch.handleChar(e.key);
      }
    });
  },

  _navigateRow(direction) {
    const pane = this.activePane;
    if (!pane) return;

    if (pane === 'tree') {
      const nodes = TreeView.container.querySelectorAll('.tree-node');
      this._moveSelection(nodes, direction, (el) => el.click());
    } else if (pane === 'dir') {
      const entries = DirListing.container.querySelectorAll('.dir-entry');
      this._moveSelection(entries, direction, (el) => el.click());
    } else if (pane === 'logs') {
      const rows = LogsPane.scrollWrapper?.querySelectorAll('.logs-table tbody tr');
      if (rows) this._moveSelection(rows, direction, (el) => el.click());
    } else if (pane === 'filelist') {
      const files = FileListPane.container.querySelectorAll('.changed-file');
      this._moveSelection(files, direction, (el) => el.click());
    }
  },

  _moveSelection(items, direction, onSelect) {
    if (!items || items.length === 0) return;

    let currentIdx = -1;
    items.forEach((el, i) => {
      if (el.classList.contains('selected-item')) currentIdx = i;
    });

    let nextIdx;
    if (currentIdx === -1) {
      nextIdx = direction > 0 ? 0 : items.length - 1;
    } else {
      nextIdx = currentIdx + direction;
      if (nextIdx < 0) nextIdx = 0;
      if (nextIdx >= items.length) nextIdx = items.length - 1;
    }

    if (nextIdx !== currentIdx) {
      onSelect(items[nextIdx]);
      items[nextIdx].scrollIntoView({ block: 'nearest' });
    }
  },

  switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById(viewId);
    if (view) {
      view.classList.add('active');
      this.currentView = viewId;
    }
  },

  async openMainView(url, info) {
    this.repoUrl = url.replace(/\/$/, '');
    this.repoInfo = info;
    this.repoRoot = (info.repositoryRoot || '').replace(/\/$/, '');
    this.switchView('view-main');

    const opId = Utils.showLoading();
    try {
      await MainView.loadContent(this.repoUrl);
    } catch (err) {
      if (!Utils.isCancelled(opId)) console.error('Failed to load main view:', err);
    } finally {
      if (!Utils.isCancelled(opId)) Utils.hideLoading();
    }
  },

  async openDiffView(revision, filePath) {
    await DiffView.showDiff(revision, filePath);
  },

  async openDiffViewForFile(revision, filePath) {
    await DiffView.showDiff(revision, filePath);
  },

  async openBlameView(filePath, revision) {
    await BlameView.showBlame(filePath, revision);
  },

  setActivePane(paneName) {
    this.activePane = paneName;

    // Update all pane visual states
    document.querySelectorAll('.pane[data-pane]').forEach(pane => {
      if (pane.dataset.pane === paneName) {
        pane.classList.add('active-pane');
      } else {
        pane.classList.remove('active-pane');
      }
    });
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
