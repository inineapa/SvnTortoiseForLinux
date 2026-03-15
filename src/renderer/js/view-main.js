// View 2: Main View - orchestrates the 4 panes
const MainView = {
  init() {
    document.getElementById('main-close').addEventListener('click', () => {
      App.switchView('view-repo-selector');
    });

    this.setupDividers();
    this.setupPaneFocus();
  },

  setupPaneFocus() {
    // When clicking on a pane, set it as active
    document.querySelectorAll('.pane[data-pane]').forEach(pane => {
      pane.addEventListener('mousedown', () => {
        App.setActivePane(pane.dataset.pane);
      });
    });
  },

  setupDividers() {
    // Divider between tree and dir panes (vertical)
    this.makeDraggable(
      document.getElementById('divider-tree-dir'),
      'vertical',
      document.querySelector('.tree-pane'),
      document.querySelector('.dir-pane'),
      document.querySelector('.main-content')
    );

    // Divider between dir pane and right panels (vertical)
    this.makeDraggable(
      document.getElementById('divider-main'),
      'vertical',
      document.querySelector('.dir-pane'),
      document.querySelector('.right-panels'),
      document.querySelector('.main-content')
    );

    // Divider between logs and file-list panes (horizontal)
    this.makeDraggable(
      document.getElementById('divider-right'),
      'horizontal',
      document.querySelector('.logs-pane'),
      document.querySelector('.file-list-pane'),
      document.querySelector('.right-panels')
    );
  },

  makeDraggable(divider, orientation, panelA, panelB, container) {
    let startPos, startSizeA, startSizeB;

    const onMouseDown = (e) => {
      e.preventDefault();
      if (orientation === 'vertical') {
        startPos = e.clientX;
        startSizeA = panelA.getBoundingClientRect().width;
        startSizeB = panelB.getBoundingClientRect().width;
      } else {
        startPos = e.clientY;
        startSizeA = panelA.getBoundingClientRect().height;
        startSizeB = panelB.getBoundingClientRect().height;
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    };

    const onMouseMove = (e) => {
      const currentPos = orientation === 'vertical' ? e.clientX : e.clientY;
      const delta = currentPos - startPos;

      let newSizeA = startSizeA + delta;
      let newSizeB = startSizeB - delta;

      // Minimum size constraints
      const minSize = 80;
      if (newSizeA < minSize) newSizeA = minSize;
      if (newSizeB < minSize) newSizeB = minSize;

      panelA.style.flex = `0 0 ${newSizeA}px`;
      panelB.style.flex = `0 0 ${newSizeB}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    divider.addEventListener('mousedown', onMouseDown);
  },

  async loadContent(url) {
    document.getElementById('main-url').textContent = url;

    const rootName = url.split('/').pop() || 'root';

    // Load tree view and logs in parallel
    await Promise.all([
      TreeView.load(url, rootName),
      LogsPane.loadInitial()
    ]);

    FileListPane.clear();
  }
};
