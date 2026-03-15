// View 3: Diff View
const DiffView = {
  contentEl: null,
  filepathEl: null,
  counterEl: null,
  changePositions: [], // scroll positions of changed rows
  currentChangeIdx: -1,

  init() {
    this.contentEl = document.getElementById('diff-content');
    this.filepathEl = document.getElementById('diff-filepath');
    this.counterEl = document.getElementById('diff-change-counter');

    document.getElementById('diff-close').addEventListener('click', () => {
      App.switchView('view-main');
    });

    document.getElementById('diff-prev').addEventListener('click', () => this.goToChange(-1));
    document.getElementById('diff-next').addEventListener('click', () => this.goToChange(1));

    const diffBody = document.querySelector('.diff-body');
    const topInd = diffBody.querySelector('.pane-scroll-indicator.top');
    const botInd = diffBody.querySelector('.pane-scroll-indicator.bottom');
    Utils.setupScrollIndicators(this.contentEl, topInd, botInd);
  },

  goToChange(direction) {
    if (this.changePositions.length === 0) {
      this._buildChangePositions();
    }
    if (this.changePositions.length === 0) return;

    this.currentChangeIdx += direction;
    if (this.currentChangeIdx < 0) this.currentChangeIdx = 0;
    if (this.currentChangeIdx >= this.changePositions.length) this.currentChangeIdx = this.changePositions.length - 1;

    this._updateCounter();
    this.changePositions[this.currentChangeIdx].scrollIntoView({ block: 'center', behavior: 'smooth' });
  },

  _updateCounter() {
    if (this.changePositions.length === 0) {
      this.counterEl.textContent = '';
    } else {
      this.counterEl.textContent = (this.currentChangeIdx + 1) + '/' + this.changePositions.length;
    }
  },

  _buildChangePositions() {
    this.changePositions = [];
    this.currentChangeIdx = -1;
    // Find the first row of each contiguous changed block
    const rows = this.contentEl.querySelectorAll('.diff-side-by-side tr');
    let inChange = false;
    rows.forEach(tr => {
      const hasChange = tr.querySelector('.diff-del, .diff-add, .diff-mod');
      if (hasChange && !inChange) {
        this.changePositions.push(tr);
        inChange = true;
      } else if (!hasChange) {
        inChange = false;
      }
    });
  },

  async showDiff(revision, filePath) {
    const opId = Utils.showLoading();
    try {
      let diffText;
      let displayPath;

      if (filePath) {
        const baseUrl = App.repoRoot || App.repoUrl;
        diffText = await window.svnApi.diffFile(baseUrl, revision, filePath);
        displayPath = filePath;
      } else {
        diffText = await window.svnApi.diff(App.repoUrl, revision);
        displayPath = `All changes in r${revision}`;
      }

      if (Utils.isCancelled(opId)) return;

      if (!diffText || diffText.trim() === '') {
        this.contentEl.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);">No differences found for this revision.</div>';
        this.filepathEl.textContent = displayPath;
        App.switchView('view-diff');
        return;
      }

      this.filepathEl.textContent = displayPath;
      this.renderDiff(diffText);
      App.switchView('view-diff');
    } catch (err) {
      if (Utils.isCancelled(opId)) return;
      this.contentEl.innerHTML = `<div style="padding:40px;text-align:center;color:var(--danger);">Error loading diff: ${Utils.escapeHtml(err.message)}</div>`;
      App.switchView('view-diff');
    } finally {
      if (!Utils.isCancelled(opId)) Utils.hideLoading();
    }
  },

  renderDiff(diffText) {
    this.contentEl.innerHTML = '';
    this.changePositions = [];
    this.currentChangeIdx = -1;
    this.counterEl.textContent = '';
    const files = this.parseDiff(diffText);

    files.forEach(file => {
      const wrapper = document.createElement('div');
      wrapper.className = 'diff-file-wrapper';

      const header = document.createElement('div');
      header.className = 'diff-file-header';
      header.innerHTML = `<span class="diff-file-name">${Utils.escapeHtml(file.newFile || file.oldFile || 'Unknown file')}</span>`;
      wrapper.appendChild(header);

      const table = document.createElement('table');
      table.className = 'diff-side-by-side';

      file.hunks.forEach(hunk => {
        const pairs = this.buildSideBySide(hunk.lines, hunk.oldStart || 1, hunk.newStart || 1);
        pairs.forEach(pair => {
          const tr = document.createElement('tr');

          const lineNum = document.createElement('td');
          lineNum.className = 'diff-line-num';
          lineNum.textContent = pair.leftNum || pair.rightNum || '';
          tr.appendChild(lineNum);

          const leftCode = document.createElement('td');
          leftCode.className = 'diff-code diff-left';
          if (pair.leftType === 'del') { leftCode.classList.add('diff-del'); leftCode.innerHTML = this.highlightLine(pair.leftText, file.lang); }
          else if (pair.leftType === 'mod') { leftCode.classList.add('diff-mod'); leftCode.innerHTML = this.highlightLine(pair.leftText, file.lang); }
          else if (pair.leftType === 'empty') { leftCode.classList.add('diff-empty'); }
          else { leftCode.innerHTML = this.highlightLine(pair.leftText || '', file.lang); }

          const rightCode = document.createElement('td');
          rightCode.className = 'diff-code diff-right';
          if (pair.rightType === 'add') { rightCode.classList.add('diff-add'); rightCode.innerHTML = this.highlightLine(pair.rightText, file.lang); }
          else if (pair.rightType === 'mod') { rightCode.classList.add('diff-mod'); rightCode.innerHTML = this.highlightLine(pair.rightText, file.lang); }
          else if (pair.rightType === 'empty') { rightCode.classList.add('diff-empty'); }
          else { rightCode.innerHTML = this.highlightLine(pair.rightText || '', file.lang); }

          tr.appendChild(leftCode);
          tr.appendChild(rightCode);
          table.appendChild(tr);
        });
      });

      wrapper.appendChild(table);
      this.contentEl.appendChild(wrapper);
    });
  },

  parseDiff(diffText) {
    const files = [];
    const fileChunks = diffText.split(/^Index: /m);

    fileChunks.forEach(chunk => {
      if (!chunk.trim()) return;
      const lines = chunk.split('\n');
      const fileName = lines[0]?.trim();
      if (!fileName) return;

      const file = { oldFile: fileName, newFile: fileName, lang: Utils.getLanguage(fileName), hunks: [] };
      let currentHunk = null;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('@@')) {
          currentHunk = { header: line, lines: [] };
          file.hunks.push(currentHunk);
          const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
          if (match) { currentHunk.oldStart = parseInt(match[1]); currentHunk.newStart = parseInt(match[2]); }
          continue;
        }
        if (!currentHunk) continue;
        if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('===')) continue;
        if (line.startsWith('-')) { currentHunk.lines.push({ type: 'del', text: line.substring(1) }); }
        else if (line.startsWith('+')) { currentHunk.lines.push({ type: 'add', text: line.substring(1) }); }
        else if (line.startsWith(' ')) { currentHunk.lines.push({ type: 'ctx', text: line.substring(1) }); }
        else if (line.startsWith('\\')) { /* no newline */ }
      }

      if (file.hunks.length > 0) files.push(file);
    });

    return files;
  },

  buildSideBySide(lines, oldStart, newStart) {
    const pairs = [];
    let i = 0;
    let oldNum = (oldStart || 1) - 1;
    let newNum = (newStart || 1) - 1;

    while (i < lines.length) {
      const line = lines[i];
      if (line.type === 'ctx') {
        oldNum++; newNum++;
        pairs.push({ leftNum: oldNum, leftText: line.text, leftType: 'ctx', rightNum: newNum, rightText: line.text, rightType: 'ctx' });
        i++;
      } else if (line.type === 'del') {
        const dels = [], adds = [];
        while (i < lines.length && lines[i].type === 'del') { dels.push(lines[i]); i++; }
        while (i < lines.length && lines[i].type === 'add') { adds.push(lines[i]); i++; }
        const maxLen = Math.max(dels.length, adds.length);
        for (let j = 0; j < maxLen; j++) {
          const pair = {};
          if (j < dels.length && j < adds.length) {
            oldNum++; newNum++;
            pair.leftNum = oldNum; pair.leftText = dels[j].text; pair.leftType = 'mod';
            pair.rightNum = newNum; pair.rightText = adds[j].text; pair.rightType = 'mod';
          } else if (j < dels.length) {
            oldNum++;
            pair.leftNum = oldNum; pair.leftText = dels[j].text; pair.leftType = 'del';
            pair.rightNum = ''; pair.rightText = ''; pair.rightType = 'empty';
          } else {
            newNum++;
            pair.leftNum = ''; pair.leftText = ''; pair.leftType = 'empty';
            pair.rightNum = newNum; pair.rightText = adds[j].text; pair.rightType = 'add';
          }
          pairs.push(pair);
        }
      } else if (line.type === 'add') {
        newNum++;
        pairs.push({ leftNum: '', leftText: '', leftType: 'empty', rightNum: newNum, rightText: line.text, rightType: 'add' });
        i++;
      } else { i++; }
    }
    return pairs;
  },

  highlightLine(text, lang) {
    if (typeof hljs !== 'undefined' && lang && lang !== 'plaintext') {
      try {
        const result = hljs.highlight(text, { language: lang, ignoreIllegals: true });
        return result.value;
      } catch (e) { /* fall through */ }
    }
    return Utils.escapeHtml(text);
  }
};
