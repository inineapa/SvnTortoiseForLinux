const { execFile } = require('child_process');
const { XMLParser } = require('fast-xml-parser');

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => {
    return ['entry', 'logentry', 'path'].includes(name);
  }
});

function runSvn(args, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 30000;
    const child = execFile('svn', args, {
      maxBuffer: 50 * 1024 * 1024,
      timeout,
      env: { ...process.env, LC_ALL: 'C' }
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout);
      }
    });
  });
}

async function svnInfo(url) {
  const xml = await runSvn(['info', '--xml', '--non-interactive', url]);
  const parsed = xmlParser.parse(xml);
  const entry = Array.isArray(parsed.info.entry) ? parsed.info.entry[0] : parsed.info.entry;
  return {
    kind: entry['@_kind'],
    path: entry['@_path'],
    revision: entry['@_revision'],
    url: entry.url,
    relativeUrl: entry['relative-url'],
    repositoryRoot: entry.repository?.root,
    repositoryUuid: entry.repository?.uuid,
    lastChangedAuthor: entry.commit?.author,
    lastChangedRev: entry.commit?.['@_revision'],
    lastChangedDate: entry.commit?.date
  };
}

async function svnList(url) {
  const xml = await runSvn(['list', '--xml', '--non-interactive', url]);
  const parsed = xmlParser.parse(xml);
  const lists = parsed.lists?.list;
  if (!lists) return [];

  const entries = lists.entry || [];
  return entries.map(e => ({
    kind: e['@_kind'],
    name: e.name,
    size: e.size || 0,
    revision: e.commit?.['@_revision'],
    author: e.commit?.author,
    date: e.commit?.date
  }));
}

async function svnLog(url, opts = {}) {
  const args = ['log', '--xml', '-v', '--non-interactive'];

  if (opts.limit) {
    args.push('--limit', String(opts.limit));
  } else {
    args.push('--limit', '100');
  }

  if (opts.startRevision) {
    args.push('-r', `${opts.startRevision}:1`);
  } else if (opts.revision) {
    args.push('-r', opts.revision);
  }

  if (opts.search) {
    args.push('--search', opts.search);
  }

  args.push(url);

  const xml = await runSvn(args, { timeout: 60000 });
  const parsed = xmlParser.parse(xml);

  if (!parsed.log || !parsed.log.logentry) return [];

  const entries = parsed.log.logentry;
  return entries.map(e => {
    const paths = e.paths?.path || [];
    return {
      revision: e['@_revision'],
      author: e.author || 'unknown',
      date: e.date,
      msg: e.msg || '',
      changedPaths: (Array.isArray(paths) ? paths : [paths]).map(p => ({
        action: p['@_action'],
        kind: p['@_kind'] || '',
        path: typeof p === 'object' ? (p['#text'] || '') : p
      })).filter(p => p.path)
    };
  });
}

async function svnDiff(url, revision) {
  const args = ['diff', '-c', String(revision), '--extensions', '-U999999', '--non-interactive', url];
  const output = await runSvn(args, { timeout: 120000 });
  return output;
}

async function svnDiffFile(url, revision, filePath) {
  const fullUrl = url.replace(/\/$/, '') + '/' + filePath.replace(/^\//, '');
  const args = ['diff', '-c', String(revision), '--extensions', '-U999999', '--non-interactive', fullUrl];
  const output = await runSvn(args, { timeout: 120000 });
  return output;
}

async function svnBlame(url, revision) {
  const args = ['blame', '--xml', '--non-interactive'];
  if (revision) {
    // Use peg revision to pin the file at that revision
    args.push(url + '@' + revision);
  } else {
    args.push(url);
  }
  const xml = await runSvn(args, { timeout: 60000 });
  const parsed = xmlParser.parse(xml);

  const target = parsed.blame?.target;
  if (!target) return [];

  const entries = target.entry || [];
  return entries.map((e, i) => ({
    lineNumber: e['@_line-number'] || (i + 1),
    revision: e.commit?.['@_revision'] || '',
    author: e.commit?.author || '',
    date: e.commit?.date || '',
    line: '' // Line content comes from svn cat
  }));
}

async function svnCat(url, revision) {
  const args = ['cat', '--non-interactive'];
  if (revision) {
    args.push('-r', String(revision), url + '@' + revision);
  } else {
    args.push(url);
  }
  const output = await runSvn(args, { timeout: 30000 });
  return output;
}

async function svnBlameWithContent(url, revision) {
  const blameData = await svnBlame(url, revision);
  const content = await svnCat(url, revision);
  const lines = content.split('\n');

  return blameData.map((entry, i) => ({
    ...entry,
    line: i < lines.length ? lines[i] : ''
  }));
}

module.exports = {
  svnInfo,
  svnList,
  svnLog,
  svnDiff,
  svnDiffFile,
  svnBlame,
  svnBlameWithContent,
  svnCat
};
