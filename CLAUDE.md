# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
node cli.js                          # Run CLI from checkout (scans current directory)
node cli.js --path /some/repo        # Scan a specific directory
node cli.js --no-open                # Generate report without opening browser
node cli.js --stdout                 # Print JSON to stdout instead of writing files
npm run smoke:npx                    # Verify the package works via npx (pre-publish check)
npm version patch                    # Bump version (patch/minor/major)
npm publish                          # Publish to npm (public scoped package)
```

There are no tests or lint scripts.

## Architecture

The project has exactly three source files:

**`agentlens-core.js`** — Dual-environment UMD module shared between CLI and browser. Contains: `analyzeLocalRepo()` for filesystem scanning, `parseReferences()` for extracting cross-file imports, `AGENT_TOOLS` (7 tools: Claude, Codex, Cursor, Copilot, Windsurf, Aider, Devin), and `PRICING` (20+ LLM models). The UMD wrapper makes the same module work in Node.js (`module.exports`) and the browser (`window.AgentLensCore`).

**`cli.js`** — Orchestrator: parses args → resolves repos (priority: `--path` > `.agentlens.json` > cwd) → calls `analyzeLocalRepo()` → builds report JSON → injects bootstrap data into `agentlens.html` template → writes `{name}.html` + `{name}.json` sibling files → auto-opens browser. The filename defaults to the repo/folder name (e.g. `talisman-web.html`).

**`agentlens.html`** — 2600-line self-contained web app. Serves two modes:
- **Web mode**: Analyzes public GitHub repos by fetching raw content directly from `raw.githubusercontent.com`.
- **Local mode**: Reads the bootstrap `<script id="agentlens-bootstrap">` tag injected by the CLI, then fetches the sibling `.json` report file.

Global state lives in `LOCAL_STATE` (current report, loaded reports, comparisons). Rendering is plain DOM string templates — no framework. The `FILE_CONTENTS` map stores raw text for copy/translate buttons keyed by block ID (`ab-0`, `rc-1`, etc.).

## Bootstrap Injection Pattern

The CLI injects report metadata into the HTML template before `</head>`:

```html
<script id="agentlens-bootstrap" type="application/json">{"kind":"agentlens-bootstrap","defaultReportFile":"myrepo.json"}</script>
```

The HTML reads this on load and fetches the sibling JSON. When modifying the bootstrap data shape or the HTML's `readBootstrapConfig()` / `loadBootstrapReport()` functions, both sides must stay in sync.

## Key Behaviors

- **Output naming**: Default output filename is derived from the scanned folder's basename. Multi-repo configs (`.agentlens.json` with `repos` array of 2+) fall back to `agentlens-report.html`.
- **Token estimation**: `text.length / 4` — no external tokenizer dependency.
- **Reference deduplication**: A file referenced by both CLAUDE.md and AGENTS.md is counted only once. `uniqueRefs[i].fromTools` is a Set tracking which tools reference it.
- **File size cap**: Files over 512 KB are truncated with a note appended.
- **Skipped paths**: `node_modules`, `.git`, `dist`, `build`, `.next`, `vendor`, `__pycache__`, `.cache`.

## Published Package

- Package: `@hugofusinato/agentlens` on npm
- Binary installed as `agentlens` (no scope prefix)
- Distributed files: `cli.js`, `agentlens-core.js`, `agentlens.html`, `.agentlens.example.json`
- Requires Node ≥ 18
