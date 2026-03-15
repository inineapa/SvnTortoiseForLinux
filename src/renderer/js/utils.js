// Utility functions shared across views

const Utils = {
  // Format ISO date to short display
  formatDate(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Format ISO date to full display
  formatDateFull(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
  },

  // Truncate string with ellipsis
  truncate(str, maxLen) {
    if (!str) return '';
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 3) + '...';
  },

  // Escape HTML
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Get file extension
  getExtension(filename) {
    const idx = filename.lastIndexOf('.');
    if (idx === -1) return '';
    return filename.substring(idx).toLowerCase();
  },

  // Get file type class for CSS
  getFileTypeClass(name, kind) {
    if (kind === 'dir') return 'type-dir';
    const lower = name.toLowerCase();
    if (lower === 'makefile' || lower === 'gnumakefile') return 'type-makefile';
    const ext = Utils.getExtension(lower);
    switch (ext) {
      case '.c': return 'type-c';
      case '.h': return 'type-h';
      case '.sh': return 'type-sh';
      default: return 'type-file';
    }
  },

  // Get language name for highlight.js from file extension
  getLanguage(filename) {
    const lower = filename.toLowerCase();
    if (lower === 'makefile' || lower === 'gnumakefile') return 'makefile';
    const ext = Utils.getExtension(lower);
    switch (ext) {
      case '.c': return 'c';
      case '.h': return 'c';
      case '.sh': return 'bash';
      case '.py': return 'python';
      case '.js': return 'javascript';
      case '.json': return 'json';
      case '.xml': return 'xml';
      case '.html': return 'html';
      case '.css': return 'css';
      default: return 'plaintext';
    }
  },

  // Cancellation token - increments on cancel, async ops check this
  _opId: 0,

  // Show loading overlay and return an operation ID for cancellation checking
  showLoading() {
    this._opId++;
    document.getElementById('loading').style.display = 'flex';
    return this._opId;
  },

  // Hide loading overlay
  hideLoading() {
    document.getElementById('loading').style.display = 'none';
  },

  // Check if an operation has been cancelled
  isCancelled(opId) {
    return opId !== this._opId;
  },

  // Cancel loading - hides overlay, bumps token, navigates back
  cancelLoading() {
    this._opId++;
    this.hideLoading();
    if (App.currentView === 'view-diff' || App.currentView === 'view-blame') {
      App.switchView('view-main');
    }
  },

  // Setup scroll fade gradients via mask-image on the scroll element
  setupScrollIndicators(scrollEl, topIndicator, bottomIndicator) {
    if (topIndicator) topIndicator.style.display = 'none';
    if (bottomIndicator) bottomIndicator.style.display = 'none';

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      const hasOverflow = scrollHeight > clientHeight + 2;
      scrollEl.classList.toggle('scroll-fade-top', hasOverflow && scrollTop > 5);
      scrollEl.classList.toggle('scroll-fade-bottom', hasOverflow && scrollTop + clientHeight < scrollHeight - 5);
    };
    scrollEl.addEventListener('scroll', update);
    const observer = new MutationObserver(() => requestAnimationFrame(update));
    observer.observe(scrollEl, { childList: true, subtree: true });
    new ResizeObserver(update).observe(scrollEl);
    requestAnimationFrame(() => requestAnimationFrame(update));
    return update;
  },

  // Debounce function
  debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
};
