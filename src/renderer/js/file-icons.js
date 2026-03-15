// SVG file icons inspired by VS Code Material Icon Theme
// Returns inline SVG strings sized at 16x16
const FileIcons = {
  // --- Folder icons ---
  folderClosed: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 3.5C1 2.67 1.67 2 2.5 2H6l1.5 1.5H13.5C14.33 3.5 15 4.17 15 5V12.5C15 13.33 14.33 14 13.5 14H2.5C1.67 14 1 13.33 1 12.5V3.5Z" fill="#DCAD6A"/></svg>`,

  folderOpen: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 3.5C1 2.67 1.67 2 2.5 2H6l1.5 1.5H13.5C14.33 3.5 15 4.17 15 5V6H3.5L1 12.5V3.5Z" fill="#DCAD6A"/><path d="M1.5 14L3.5 7H15L13 14H1.5Z" fill="#E8C580"/></svg>`,

  folderFilled: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 3.5C1 2.67 1.67 2 2.5 2H6l1.5 1.5H13.5C14.33 3.5 15 4.17 15 5V12.5C15 13.33 14.33 14 13.5 14H2.5C1.67 14 1 13.33 1 12.5V3.5Z" fill="#DCAD6A"/><rect x="4" y="6" width="8" height="1.5" rx="0.5" fill="#B8942E"/><rect x="4" y="8.5" width="6" height="1.5" rx="0.5" fill="#B8942E"/></svg>`,

  // --- Language/file icons ---
  c: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#3E76A1"/><text x="8" y="12" text-anchor="middle" font-size="11" font-weight="bold" fill="white" font-family="monospace">C</text></svg>`,

  h: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#6E4FA0"/><text x="8" y="12" text-anchor="middle" font-size="11" font-weight="bold" fill="white" font-family="monospace">H</text></svg>`,

  cpp: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#3E76A1"/><text x="8" y="11.5" text-anchor="middle" font-size="9" font-weight="bold" fill="white" font-family="monospace">C++</text></svg>`,

  sh: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#3E4A3E"/><text x="8" y="12" text-anchor="middle" font-size="10" font-weight="bold" fill="#89E051" font-family="monospace">$_</text></svg>`,

  makefile: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#6D4C13"/><text x="8" y="12" text-anchor="middle" font-size="10" font-weight="bold" fill="#E8C27A" font-family="monospace">M</text></svg>`,

  python: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#3572A5"/><text x="8" y="12" text-anchor="middle" font-size="11" font-weight="bold" fill="#FFD43B" font-family="monospace">Py</text></svg>`,

  js: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#F7DF1E"/><text x="8" y="12" text-anchor="middle" font-size="10" font-weight="bold" fill="#333" font-family="monospace">JS</text></svg>`,

  ts: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#3178C6"/><text x="8" y="12" text-anchor="middle" font-size="10" font-weight="bold" fill="white" font-family="monospace">TS</text></svg>`,

  java: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#B07219"/><text x="8" y="12" text-anchor="middle" font-size="9" font-weight="bold" fill="white" font-family="monospace">Jv</text></svg>`,

  rust: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#CE412B"/><text x="8" y="12" text-anchor="middle" font-size="10" font-weight="bold" fill="white" font-family="monospace">Rs</text></svg>`,

  go: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#00ADD8"/><text x="8" y="12" text-anchor="middle" font-size="10" font-weight="bold" fill="white" font-family="monospace">Go</text></svg>`,

  html: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#E44D26"/><text x="8" y="11.5" text-anchor="middle" font-size="7" font-weight="bold" fill="white" font-family="monospace">&lt;/&gt;</text></svg>`,

  css: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#264DE4"/><text x="8" y="12" text-anchor="middle" font-size="8" font-weight="bold" fill="white" font-family="monospace">css</text></svg>`,

  json: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#5B5B5B"/><text x="8" y="12" text-anchor="middle" font-size="8" font-weight="bold" fill="#F7DF1E" font-family="monospace">{}</text></svg>`,

  xml: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#F06529"/><text x="8" y="11.5" text-anchor="middle" font-size="7" font-weight="bold" fill="white" font-family="monospace">&lt;/&gt;</text></svg>`,

  yaml: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#CB171E"/><text x="8" y="12" text-anchor="middle" font-size="8" font-weight="bold" fill="white" font-family="monospace">yml</text></svg>`,

  md: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#3993D0"/><text x="8" y="12" text-anchor="middle" font-size="9" font-weight="bold" fill="white" font-family="monospace">M↓</text></svg>`,

  txt: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#5B5B5B"/><text x="8" y="12" text-anchor="middle" font-size="8" font-weight="bold" fill="#CCC" font-family="monospace">txt</text></svg>`,

  conf: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#6D6D6D"/><text x="8" y="12" text-anchor="middle" font-size="10" font-weight="bold" fill="#CCC" font-family="monospace">⚙</text></svg>`,

  sql: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#336791"/><text x="8" y="12" text-anchor="middle" font-size="8" font-weight="bold" fill="white" font-family="monospace">SQL</text></svg>`,

  ruby: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#CC342D"/><text x="8" y="12" text-anchor="middle" font-size="10" font-weight="bold" fill="white" font-family="monospace">rb</text></svg>`,

  image: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#4CAF50"/><text x="8" y="12" text-anchor="middle" font-size="8" font-weight="bold" fill="white" font-family="monospace">img</text></svg>`,

  binary: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#555"/><text x="8" y="12" text-anchor="middle" font-size="8" font-weight="bold" fill="#999" font-family="monospace">bin</text></svg>`,

  lock: `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#6B6B6B"/><text x="8" y="12" text-anchor="middle" font-size="10" font-weight="bold" fill="#FFD700" font-family="monospace">🔒</text></svg>`,

  generic: `<svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="1" width="12" height="14" rx="1" fill="#5B5B5B"/><rect x="4" y="4" width="8" height="1" fill="#888"/><rect x="4" y="6.5" width="6" height="1" fill="#888"/><rect x="4" y="9" width="7" height="1" fill="#888"/></svg>`,

  // Get icon HTML for a file
  getIcon(name, kind) {
    if (kind === 'dir') return this.folderClosed;
    const lower = name.toLowerCase();

    // Special filenames
    if (lower === 'makefile' || lower === 'gnumakefile' || lower === 'cmakelists.txt') return this.makefile;
    if (lower === 'dockerfile' || lower.startsWith('dockerfile.')) return this.conf;
    if (lower === 'kconfig' || lower === 'kbuild') return this.makefile;
    if (lower.endsWith('.lock')) return this.lock;

    const ext = lower.lastIndexOf('.') !== -1 ? lower.substring(lower.lastIndexOf('.')) : '';
    switch (ext) {
      case '.c': return this.c;
      case '.h': return this.h;
      case '.cpp': case '.cc': case '.cxx': case '.hpp': return this.cpp;
      case '.sh': case '.bash': case '.zsh': return this.sh;
      case '.py': case '.pyw': return this.python;
      case '.js': case '.jsx': case '.mjs': case '.cjs': return this.js;
      case '.ts': case '.tsx': return this.ts;
      case '.java': return this.java;
      case '.rs': return this.rust;
      case '.go': return this.go;
      case '.rb': return this.ruby;
      case '.html': case '.htm': return this.html;
      case '.css': case '.scss': case '.less': return this.css;
      case '.json': return this.json;
      case '.xml': case '.xsl': case '.xslt': case '.svg': return this.xml;
      case '.yaml': case '.yml': return this.yaml;
      case '.md': case '.markdown': case '.rst': return this.md;
      case '.txt': case '.log': case '.csv': return this.txt;
      case '.conf': case '.cfg': case '.ini': case '.toml': case '.env': case '.properties': return this.conf;
      case '.sql': return this.sql;
      case '.png': case '.jpg': case '.jpeg': case '.gif': case '.bmp': case '.ico': case '.webp': return this.image;
      case '.o': case '.a': case '.so': case '.dll': case '.exe': case '.bin': case '.ko': return this.binary;
      case '.S': case '.s': case '.asm': return this.c;
      case '.pl': case '.pm': return this.ruby;
      default: return this.generic;
    }
  },

  // Get tree folder icon based on state
  getTreeIcon(expanded) {
    if (expanded) return this.folderOpen;
    return this.folderClosed;
  }
};
