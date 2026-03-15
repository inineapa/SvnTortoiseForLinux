# SVN Tortoise for Linux

A TortoiseSVN-like desktop application for Ubuntu/Linux, built with Electron. Browse SVN repositories, view logs, diffs, and blame — all from a native desktop GUI.

![License](https://img.shields.io/badge/license-ISC-blue)
![Platform](https://img.shields.io/badge/platform-Linux%20x86__64-lightgrey)
![Electron](https://img.shields.io/badge/electron-41-blue)

## Features

- **Repository Selector** — Enter or pick from recently used SVN repository URLs
- **Tree View** — Lazy-loaded directory tree with expand/collapse and indent guides
- **Directory Listing** — Browse files with type-specific SVG icons and metadata
- **Log Viewer** — Filterable SVN log with infinite scroll, author coloring, and resizable columns
- **Side-by-Side Diff** — Full-context diff view with syntax highlighting, change navigation, and line numbers
- **Blame View** — Annotated blame with revision chain navigation (click a revision to blame at that point)
- **Fuzzy Search** — Type-ahead search across all panes
- **Keyboard Navigation** — Arrow keys, Escape to go back, Ctrl+C to cancel loading

## Requirements

- **Linux x86_64** (tested on Ubuntu 22.04+)
- **Subversion** (`svn`) command-line client

```bash
sudo apt install subversion
```

## Installation

### AppImage (recommended)

Download `SVN Tortoise-1.0.0.AppImage` from [Releases](https://github.com/inineapa/SvnTortoiseForLinux/releases), then:

```bash
chmod +x "SVN Tortoise-1.0.0.AppImage"
./"SVN Tortoise-1.0.0.AppImage"
```

### Debian package

```bash
sudo dpkg -i svn-tortoise_1.0.0_amd64.deb
```

This will automatically pull in `subversion` as a dependency.

### From source

```bash
git clone https://github.com/inineapa/SvnTortoiseForLinux.git
cd SvnTortoiseForLinux
npm install
npm start
```

## Building

```bash
npm run dist            # Build both .deb and .AppImage
npm run dist:deb        # Build .deb only
npm run dist:appimage   # Build .AppImage only
```

Output goes to the `dist/` directory.

## Architecture

```
src/
  main/           # Electron main process
    main.js         - App entry, window creation, SVN check
    ipc-handlers.js - IPC bridge between renderer and SVN
    svn-service.js  - SVN CLI wrapper (info, list, log, diff, blame, cat)
    store.js        - Persistent storage for recent URLs
  preload/
    preload.js      - Context bridge exposing svnApi, storeApi, hljs
  renderer/
    index.html      - Single-page app with 4 views
    js/             - View controllers and utilities
    styles/         - CSS modules per view/pane
```

The app wraps the `svn` command-line tool with `--xml` output, parsed via `fast-xml-parser`. Syntax highlighting uses `highlight.js`. No server or network component beyond SVN itself.

## License

ISC
