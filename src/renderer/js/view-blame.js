// View 4: Blame View
const BlameView = {
  contentEl: null,
  chainEl: null,
  tableWrapper: null,
  blameChain: [],
  currentFileUrl: '',
  currentFilePath: '',

  // 16+ distinct subtle background colors for revisions
  revColors: [
    'rgba(0, 120, 215, 0.12)',
    'rgba(215, 60, 0, 0.12)',
    'rgba(0, 160, 80, 0.12)',
    'rgba(160, 80, 200, 0.12)',
    'rgba(200, 160, 0, 0.12)',
    'rgba(0, 160, 160, 0.12)',
    'rgba(200, 0, 100, 0.12)',
    'rgba(80, 120, 0, 0.12)',
    'rgba(100, 60, 180, 0.12)',
    'rgba(0, 100, 140, 0.12)',
    'rgba(180, 100, 40, 0.12)',
    'rgba(60, 160, 120, 0.12)',
    'rgba(180, 40, 60, 0.12)',
    'rgba(100, 140, 200, 0.12)',
    'rgba(140, 100, 60, 0.12)',
    'rgba(60, 100, 160, 0.12)',
    'rgba(160, 120, 80, 0.12)',
    'rgba(80, 160, 40, 0.12)',
    'rgba(200, 80, 160, 0.12)',
    'rgba(40, 140, 100, 0.12)',
  ],

  init() {
    this.contentEl = document.getElementById('blame-content');
    this.chainEl = document.getElementById('blame-chain');
    this.tableWrapper = document.getElementById('blame-table-wrapper');

    document.getElementById('blame-close').addEventListener('click', () => {
      App.switchView('view-main');
    });

    const topInd = this.contentEl.querySelector('.pane-scroll-indicator.top');
    const botInd = this.contentEl.querySelector('.pane-scroll-indicator.bottom');
    Utils.setupScrollIndicators(this.tableWrapper, topInd, botInd);
  },

  async showBlame(filePath, revision) {
    const cleanPath = filePath.replace(/^\//, '');
    this.currentFilePath = cleanPath;

    if (filePath.startsWith('/') && App.repoRoot) {
      this.currentFileUrl = App.repoRoot + '/' + cleanPath;
    } else {
      this.currentFileUrl = App.repoUrl + '/' + cleanPath;
    }

    const opId = Utils.showLoading();

    if (!revision) {
      try {
        const info = await window.svnApi.info(this.currentFileUrl);
        if (Utils.isCancelled(opId)) return;
        revision = String(info.lastChangedRev || info.revision || 'HEAD');
      } catch (err) {
        if (Utils.isCancelled(opId)) return;
        this.tableWrapper.innerHTML = `<div style="padding:40px;text-align:center;color:var(--danger);">Error: ${Utils.escapeHtml(err.message)}</div>`;
        App.switchView('view-blame');
        Utils.hideLoading();
        return;
      }
    }

    revision = String(revision);
    this.blameChain = [{ revision, filePath: cleanPath }];
    await this._loadBlameWithOp(revision, opId);
    if (!Utils.isCancelled(opId)) App.switchView('view-blame');
  },

  async blameAtRevision(revision) {
    revision = String(revision);
    this.blameChain.push({ revision, filePath: this.currentFilePath });
    const opId = Utils.showLoading();
    await this._loadBlameWithOp(revision, opId);
  },

  async jumpToChainIndex(index) {
    this.blameChain = this.blameChain.slice(0, index + 1);
    const entry = this.blameChain[index];
    const opId = Utils.showLoading();
    await this._loadBlameWithOp(entry.revision, opId);
  },

  async _loadBlameWithOp(revision, opId) {
    try {
      const blameData = await window.svnApi.blame(this.currentFileUrl, revision);
      if (Utils.isCancelled(opId)) return;
      this.renderChain();
      this.renderBlame(blameData, String(revision));
    } catch (err) {
      if (Utils.isCancelled(opId)) return;
      this.tableWrapper.innerHTML = `<div style="padding:40px;text-align:center;color:var(--danger);">Error loading blame: ${Utils.escapeHtml(err.message)}</div>`;
      this.renderChain();
    } finally {
      if (!Utils.isCancelled(opId)) Utils.hideLoading();
    }
  },

  renderChain() {
    this.chainEl.innerHTML = '';
    this.blameChain.forEach((entry, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'blame-chain-separator';
        sep.textContent = '>';
        this.chainEl.appendChild(sep);
      }

      const item = document.createElement('span');
      item.className = 'blame-chain-item';
      item.textContent = 'r' + entry.revision;

      if (i === this.blameChain.length - 1) {
        item.classList.add('current');
      } else {
        item.addEventListener('click', () => this.jumpToChainIndex(i));
      }

      this.chainEl.appendChild(item);
    });
  },

  renderBlame(blameData, currentRevision) {
    this.tableWrapper.innerHTML = '';

    if (!blameData || blameData.length === 0) {
      this.tableWrapper.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);">No blame data available.</div>';
      return;
    }

    const lang = Utils.getLanguage(this.currentFilePath);

    // Assign colors to revisions
    const revColorMap = new Map();
    let colorIdx = 0;
    blameData.forEach(entry => {
      if (!revColorMap.has(entry.revision)) {
        revColorMap.set(entry.revision, this.revColors[colorIdx % this.revColors.length]);
        colorIdx++;
      }
    });

    const table = document.createElement('table');
    table.className = 'blame-table';

    blameData.forEach((entry, i) => {
      const tr = document.createElement('tr');
      const bgColor = revColorMap.get(entry.revision);

      // Revision column
      const revTd = document.createElement('td');
      revTd.className = 'blame-col-rev';
      revTd.style.backgroundColor = bgColor;
      revTd.textContent = 'r' + entry.revision;
      if (String(entry.revision) !== String(currentRevision)) {
        revTd.addEventListener('click', () => this.blameAtRevision(entry.revision));
      } else {
        revTd.style.cursor = 'default';
        revTd.style.color = 'var(--text-secondary)';
      }
      tr.appendChild(revTd);

      // Author column
      const authorTd = document.createElement('td');
      authorTd.className = 'blame-col-author';
      authorTd.style.backgroundColor = bgColor;
      authorTd.textContent = entry.author;
      tr.appendChild(authorTd);

      // Date column
      const dateTd = document.createElement('td');
      dateTd.className = 'blame-col-date';
      dateTd.style.backgroundColor = bgColor;
      dateTd.textContent = Utils.formatDateFull(entry.date);
      tr.appendChild(dateTd);

      // Line number column
      const lineTd = document.createElement('td');
      lineTd.className = 'blame-col-line';
      lineTd.style.backgroundColor = bgColor;
      lineTd.textContent = entry.lineNumber;
      tr.appendChild(lineTd);

      // Code column (no background color)
      const codeTd = document.createElement('td');
      codeTd.className = 'blame-col-code';
      codeTd.innerHTML = this.highlightLine(entry.line, lang);
      tr.appendChild(codeTd);

      tr.dataset.revision = entry.revision;
      table.appendChild(tr);
    });

    // Hover: highlight all rows with the same revision
    table.addEventListener('mouseover', (e) => {
      const tr = e.target.closest('tr');
      if (!tr || !tr.dataset.revision) return;
      const rev = tr.dataset.revision;
      if (this._hoveredRev === rev) return;
      this._clearRevHover();
      this._hoveredRev = rev;
      table.querySelectorAll(`tr[data-revision="${rev}"]`).forEach(row => {
        row.classList.add('blame-hover-rev');
      });
    });
    table.addEventListener('mouseleave', () => {
      this._clearRevHover();
    });

    this.tableWrapper.appendChild(table);
  },

  _hoveredRev: null,

  _clearRevHover() {
    if (!this._hoveredRev) return;
    const table = this.tableWrapper.querySelector('.blame-table');
    if (table) {
      table.querySelectorAll('.blame-hover-rev').forEach(row => {
        row.classList.remove('blame-hover-rev');
      });
    }
    this._hoveredRev = null;
  },

  highlightLine(text, lang) {
    if (typeof hljs !== 'undefined' && lang && lang !== 'plaintext') {
      try {
        const result = hljs.highlight(text, { language: lang, ignoreIllegals: true });
        return '<code>' + result.value + '</code>';
      } catch (e) { /* fall through */ }
    }
    return '<code>' + Utils.escapeHtml(text) + '</code>';
  }
};
