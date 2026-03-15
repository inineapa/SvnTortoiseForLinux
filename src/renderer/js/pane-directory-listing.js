// DirectoryListing Pane
const DirListing = {
  container: null,
  currentUrl: '',
  currentPath: '', // relative to root
  entries: [],

  init() {
    this.container = document.getElementById('dir-content');
    const pane = document.getElementById('dir-pane');
    const topInd = pane.querySelector('.pane-scroll-indicator.top');
    const botInd = pane.querySelector('.pane-scroll-indicator.bottom');
    Utils.setupScrollIndicators(this.container, topInd, botInd);
  },

  async load(url, relativePath) {
    this.currentUrl = url;
    this.currentPath = relativePath || '';

    try {
      const entries = await window.svnApi.list(url);
      this.entries = entries;
      this.render();
    } catch (err) {
      this.container.innerHTML = `<div class="file-list-empty">Error loading directory: ${Utils.escapeHtml(err.message)}</div>`;
    }
  },

  render() {
    this.container.innerHTML = '';

    const isRoot = !this.currentPath;

    // '../' entry
    const upEntry = document.createElement('div');
    upEntry.className = 'dir-entry type-up';
    if (isRoot) {
      upEntry.classList.add('disabled');
    }
    upEntry.innerHTML = `<span class="entry-icon">\u{2B06}</span><span class="entry-name">../</span>`;
    if (!isRoot) {
      upEntry.addEventListener('click', () => {
        this.setSelected(upEntry);
        App.setActivePane('dir');
        this.navigateUp();
      });
    }
    this.container.appendChild(upEntry);

    // Current directory header
    const header = document.createElement('div');
    header.className = 'dir-header';
    header.textContent = this.currentPath ? this.currentPath + '/' : this.currentPath || TreeView.rootName + '/';
    this.container.appendChild(header);

    // Entries container (indented)
    const listContainer = document.createElement('div');
    listContainer.className = 'dir-indent';

    // Sort: directories first, then files, alphabetically
    const sorted = [...this.entries].sort((a, b) => {
      if (a.kind === 'dir' && b.kind !== 'dir') return -1;
      if (a.kind !== 'dir' && b.kind === 'dir') return 1;
      return a.name.localeCompare(b.name);
    });

    sorted.forEach(entry => {
      const div = document.createElement('div');
      const typeClass = Utils.getFileTypeClass(entry.name, entry.kind);
      div.className = `dir-entry ${typeClass}`;

      const iconSvg = FileIcons.getIcon(entry.name, entry.kind);
      const displayName = entry.kind === 'dir' ? entry.name + '/' : entry.name;
      div.innerHTML = `<span class="entry-icon">${iconSvg}</span><span class="entry-name">${Utils.escapeHtml(displayName)}</span>`;
      div.dataset.name = entry.name;

      // Click handler - single click selects, double click navigates into dir
      div.addEventListener('click', () => {
        this.setSelected(div);
        App.setActivePane('dir');
      });

      if (entry.kind === 'dir') {
        div.addEventListener('dblclick', () => this.navigateInto(entry.name));
      }

      // Right-click context menu
      div.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.setSelected(div);
        App.setActivePane('dir');

        if (entry.kind === 'dir') {
          const dirPath = this.currentPath
            ? this.currentPath + '/' + entry.name
            : entry.name;
          ContextMenu.show(e.clientX, e.clientY, [
            {
              label: 'Show logs for this directory',
              action: () => LogsPane.showLogsForPath(dirPath)
            }
          ]);
        } else {
          const filePath = this.currentPath
            ? this.currentPath + '/' + entry.name
            : entry.name;
          ContextMenu.show(e.clientX, e.clientY, [
            {
              label: 'Show logs for this file',
              action: () => LogsPane.showLogsForPath(filePath)
            },
            {
              label: 'Blame this file',
              action: () => App.openBlameView(filePath)
            }
          ]);
        }
      });

      listContainer.appendChild(div);
    });

    this.container.appendChild(listContainer);
  },

  setSelected(el) {
    this.container.querySelectorAll('.selected-item').forEach(s => s.classList.remove('selected-item'));
    el.classList.add('selected-item');
  },

  navigateUp() {
    if (!this.currentPath) return;
    const parts = this.currentPath.split('/');
    parts.pop();
    const parentPath = parts.join('/');
    const parentUrl = parentPath
      ? TreeView.rootUrl + '/' + parentPath
      : TreeView.rootUrl;

    // Update tree view selection
    TreeView.selectedPath = parentPath;
    TreeView.render();

    this.load(parentUrl, parentPath);
    App.setActivePane('dir');
  },

  navigateInto(dirName) {
    const newPath = this.currentPath
      ? this.currentPath + '/' + dirName
      : dirName;
    const newUrl = TreeView.rootUrl + '/' + newPath;

    // Expand in tree view and select
    TreeView.expandToPath(newPath);

    this.load(newUrl, newPath);
    App.setActivePane('dir');
  }
};
