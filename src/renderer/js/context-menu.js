// Context menu handler
const ContextMenu = {
  menuEl: null,

  init() {
    this.menuEl = document.getElementById('context-menu');
    document.addEventListener('click', () => this.hide());
    document.addEventListener('contextmenu', (e) => {
      // Only prevent default if we're going to show our own menu
      // This is handled by the individual pane handlers
    });
  },

  show(x, y, items) {
    this.menuEl.innerHTML = '';
    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'context-menu-item';
      div.textContent = item.label;
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hide();
        item.action();
      });
      this.menuEl.appendChild(div);
    });

    this.menuEl.style.display = 'block';
    this.menuEl.style.left = x + 'px';
    this.menuEl.style.top = y + 'px';

    // Make sure menu doesn't go off screen
    requestAnimationFrame(() => {
      const rect = this.menuEl.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        this.menuEl.style.left = (window.innerWidth - rect.width - 5) + 'px';
      }
      if (rect.bottom > window.innerHeight) {
        this.menuEl.style.top = (window.innerHeight - rect.height - 5) + 'px';
      }
    });
  },

  hide() {
    if (this.menuEl) {
      this.menuEl.style.display = 'none';
    }
  }
};
