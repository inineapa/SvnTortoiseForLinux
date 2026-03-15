// FILE_LIST Pane
const FileListPane = {
  container: null,
  currentLog: null,

  init() {
    this.container = document.getElementById('file-list-content');
    const pane = document.getElementById('file-list-pane');
    const topInd = pane.querySelector('.pane-scroll-indicator.top');
    const botInd = pane.querySelector('.pane-scroll-indicator.bottom');
    Utils.setupScrollIndicators(this.container, topInd, botInd);
  },

  clear() {
    this.currentLog = null;
    this.container.innerHTML = '<div class="file-list-empty">Select a log entry to view details</div>';
  },

  showCommit(log) {
    this.currentLog = log;
    this.container.innerHTML = '';

    // Commit details
    const detail = document.createElement('div');
    detail.className = 'file-list-detail';
    detail.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">Revision:</span>
        <span class="detail-value">r${Utils.escapeHtml(String(log.revision))}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Author:</span>
        <span class="detail-value">${Utils.escapeHtml(log.author)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date:</span>
        <span class="detail-value">${Utils.formatDateFull(log.date)}</span>
      </div>
      <div class="detail-msg">${Utils.escapeHtml(log.msg)}</div>
    `;
    this.container.appendChild(detail);

    // Separator
    const sep = document.createElement('hr');
    sep.className = 'file-list-separator';
    this.container.appendChild(sep);

    // Changed files
    if (log.changedPaths && log.changedPaths.length > 0) {
      log.changedPaths.forEach(cp => {
        const div = document.createElement('div');
        div.className = 'changed-file';

        const actionClass = 'action-' + cp.action;
        const pathClass = 'path-' + cp.action;

        div.innerHTML = `
          <span class="file-action ${actionClass}">${Utils.escapeHtml(cp.action)}</span>
          <span class="file-path ${pathClass}">${Utils.escapeHtml(cp.path)}</span>
        `;

        div.addEventListener('click', () => {
          this.setSelected(div);
          App.setActivePane('filelist');
        });

        div.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.setSelected(div);
          App.setActivePane('filelist');

          const items = [
            {
              label: 'Show diff for this file',
              action: () => App.openDiffViewForFile(log.revision, cp.path)
            }
          ];

          // Only show blame for non-deleted files
          if (cp.action !== 'D') {
            items.push({
              label: 'Blame this file in this revision',
              action: () => App.openBlameView(cp.path, log.revision)
            });
          }

          ContextMenu.show(e.clientX, e.clientY, items);
        });

        this.container.appendChild(div);
      });
    } else {
      const empty = document.createElement('div');
      empty.className = 'file-list-empty';
      empty.textContent = 'No changed files recorded.';
      this.container.appendChild(empty);
    }
  },

  setSelected(el) {
    this.container.querySelectorAll('.selected-item').forEach(s => s.classList.remove('selected-item'));
    el.classList.add('selected-item');
  }
};
