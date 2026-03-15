// TreeView Pane - shows directory tree structure
const TreeView = {
  container: null,
  rootUrl: '',
  rootName: '',
  treeData: {}, // path -> { name, children: [], expanded: false, hasSubdirs: bool }
  selectedPath: '',

  init() {
    this.container = document.getElementById('tree-content');
    const pane = document.getElementById('tree-pane');
    const topInd = pane.querySelector('.pane-scroll-indicator.top');
    const botInd = pane.querySelector('.pane-scroll-indicator.bottom');
    Utils.setupScrollIndicators(this.container, topInd, botInd);
  },

  async load(url, rootName) {
    this.rootUrl = url.replace(/\/$/, '');
    this.rootName = rootName || url.split('/').pop() || 'root';
    this.treeData = {};
    this.selectedPath = '';

    // Fetch root directory listing
    const entries = await window.svnApi.list(this.rootUrl);
    const subdirs = entries.filter(e => e.kind === 'dir');

    this.treeData[''] = {
      name: this.rootName,
      children: subdirs.map(d => d.name),
      expanded: true,
      hasSubdirs: subdirs.length > 0,
      loaded: true
    };

    // Fully load each first-level subdir (check if they have subdirs)
    await Promise.all(subdirs.map(async (dir) => {
      await this._loadNodeFully(dir.name);
    }));

    this.selectedPath = '';
    this.render();

    // Select root by default
    this.selectDirectory('');
  },

  // Load a node: list its contents, determine hasSubdirs, create child stubs
  async _loadNodeFully(path) {
    const fullUrl = path ? this.rootUrl + '/' + path : this.rootUrl;
    try {
      const entries = await window.svnApi.list(fullUrl);
      const subdirs = entries.filter(e => e.kind === 'dir');
      const name = path.includes('/') ? path.split('/').pop() : path;

      this.treeData[path] = {
        name: name,
        children: subdirs.map(d => d.name),
        expanded: false,
        hasSubdirs: subdirs.length > 0,
        loaded: true
      };
    } catch (err) {
      const name = path.includes('/') ? path.split('/').pop() : path;
      this.treeData[path] = {
        name: name,
        children: [],
        expanded: false,
        hasSubdirs: false,
        loaded: true
      };
    }
  },

  // Load children of a node AND pre-check grandchildren for hasSubdirs
  async loadChildren(path) {
    const node = this.treeData[path];
    if (!node || node.loaded) {
      // If already loaded, still need to check children
    }

    // First, ensure this node itself is loaded
    if (!node || !node.loaded) {
      await this._loadNodeFully(path);
    }

    const currentNode = this.treeData[path];
    if (!currentNode) return;

    // Now load each child fully so we know their hasSubdirs
    await Promise.all(currentNode.children.map(async (childName) => {
      const childPath = path ? path + '/' + childName : childName;
      if (!this.treeData[childPath] || !this.treeData[childPath].loaded) {
        await this._loadNodeFully(childPath);
      }
    }));
  },

  async toggleExpand(path) {
    const node = this.treeData[path];
    if (!node) return;

    if (node.expanded) {
      node.expanded = false;
      this.render();
    } else {
      // Ensure children are loaded with their hasSubdirs resolved
      await this.loadChildren(path);
      node.expanded = true;
      this.render();
    }
  },

  selectDirectory(path) {
    this.selectedPath = path;
    this.render();

    // Notify DirectoryListing pane
    const fullUrl = path ? this.rootUrl + '/' + path : this.rootUrl;
    DirListing.load(fullUrl, path);

    // Set active pane
    App.setActivePane('tree');
  },

  async expandToPath(path) {
    // Expand all parent directories to reveal a path
    const parts = path.split('/');
    let current = '';
    for (let i = 0; i < parts.length; i++) {
      current = i === 0 ? parts[0] : current + '/' + parts[i];
      const node = this.treeData[current];
      if (node && !node.expanded) {
        await this.loadChildren(current);
        node.expanded = true;
      } else if (!node) {
        // Node doesn't exist in tree data yet, need to load parent
        const parentPath = current.split('/').slice(0, -1).join('/');
        await this.loadChildren(parentPath);
        if (this.treeData[current]) {
          await this.loadChildren(current);
          this.treeData[current].expanded = true;
        }
      }
    }
    this.selectedPath = path;
    this.render();

    // Scroll selected into view
    requestAnimationFrame(() => {
      const sel = this.container.querySelector('.selected-item');
      if (sel) sel.scrollIntoView({ block: 'nearest' });
    });
  },

  render() {
    this.container.innerHTML = '';
    this._renderNode('', 0, [], true);
  },

  // parentContinues[i] = true means ancestor at depth i has more siblings below
  _renderNode(path, depth, parentContinues, isLast) {
    const node = this.treeData[path];
    if (!node) return;

    const div = document.createElement('div');
    div.className = 'tree-node';
    if (path === this.selectedPath) {
      div.classList.add('selected-item');
    }

    // Build indent with tree lines
    const indent = document.createElement('span');
    indent.className = 'tree-indent';

    for (let i = 0; i < depth; i++) {
      const unit = document.createElement('span');
      unit.className = 'tree-indent-unit';

      if (i < depth - 1) {
        // Ancestor column: vertical line if that ancestor has more siblings
        if (parentContinues[i]) {
          unit.classList.add('line');
        }
      } else {
        // This node's connector column
        unit.classList.add(isLast ? 'last-branch' : 'branch');
      }
      indent.appendChild(unit);
    }

    div.appendChild(indent);

    // Directory icon
    const icon = document.createElement('span');
    icon.className = 'tree-icon';
    icon.innerHTML = FileIcons.getTreeIcon(node.expanded);
    div.appendChild(icon);

    // Label - append '/' for dirs with subdirs
    const label = document.createElement('span');
    label.className = 'tree-label';
    label.textContent = node.hasSubdirs ? node.name + '/' : node.name;
    div.appendChild(label);

    div.dataset.path = path;

    // Single click selects, double click toggles expand/collapse (only if has subdirs)
    div.addEventListener('click', (e) => {
      this.selectDirectory(path);
    });
    if (node.hasSubdirs === true) {
      div.addEventListener('dblclick', (e) => {
        e.preventDefault();
        this.toggleExpand(path);
      });
    }

    // Right-click context menu
    div.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.selectDirectory(path);
      ContextMenu.show(e.clientX, e.clientY, [
        {
          label: 'Show logs for this directory',
          action: () => {
            LogsPane.showLogsForPath(path || '');
          }
        }
      ]);
    });

    this.container.appendChild(div);

    // Render children if expanded
    if (node.expanded && node.children.length > 0) {
      const childPaths = node.children.map(name =>
        path ? path + '/' + name : name
      );

      // Build parentContinues for children:
      // Copy current array and set whether this node continues (has more siblings)
      const childContinues = parentContinues.slice();
      if (depth > 0) {
        // Ensure the array covers up to this depth
        while (childContinues.length < depth) childContinues.push(false);
        childContinues[depth - 1] = !isLast;
      }

      childPaths.forEach((childPath, i) => {
        const isLastChild = i === childPaths.length - 1;
        this._renderNode(childPath, depth + 1, childContinues, isLastChild);
      });
    }
  }
};
