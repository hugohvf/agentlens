# AgentLens — AI Context Cost Scanner

**AgentLens** scans repositories for AI agent configuration files (`CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `copilot-instructions.md`, and more), resolves every referenced file, and calculates the real token cost per request across all major LLM providers.

Works as a **web app** (public GitHub repos) and a **CLI** (local/private repos) — same UI either way.

---

## Web App

Zero-install. Download `agentlens.html`, open in any browser, paste a GitHub URL.

```
1. Download agentlens.html
2. Open in Chrome, Firefox, Safari, or Edge
3. Paste: https://github.com/owner/repo
4. Click Analyze
```

All processing happens in your browser via the GitHub public API.

---

## CLI — Scan Local & Private Repos

Scan any local repository and get the same interactive HTML report — no GitHub API, no internet required for the scan.

### Requirements

- Node.js ≥ 18

### Install

```bash
npm install -g agentlens
# or run without installing:
npx agentlens
```

### Usage

```bash
# Scan current directory
agentlens

# Scan a specific path
agentlens /path/to/my-repo

# Scan multiple repos at once
agentlens --path . --path ../other-service

# Custom output file
agentlens --out report.html

# Open in browser immediately after generating
agentlens --open

# Print JSON summary to stdout (no HTML)
agentlens --stdout

# Use a config file (see .agentlens.json below)
agentlens --config .agentlens.json

# Version
agentlens --version
```

The generated `agentlens-report.html` opens immediately with your local repo data. You can still add public GitHub repos in the Compare tab for baseline comparison — those are fetched live from your browser.

### `.agentlens.json` — Workspace Config

Place this file in your repo root to define which paths to scan and which public repos to use as baselines:

```json
{
  "repos": [
    { "path": ".", "name": "My App" },
    { "path": "../other-service", "name": "Other Service" }
  ],
  "baselines": [
    "anthropics/anthropic-cookbook",
    "openai/openai-agents-python"
  ],
  "output": "agentlens-report.html"
}
```

Run `agentlens` with no flags in the same directory — it picks up the config automatically.

- `repos` — local paths to scan (resolved relative to the config file). Defaults to `[{ "path": "." }]` if omitted.
- `baselines` — public GitHub repos pre-loaded in the Compare tab as baseline references (fetched live in the browser).
- `output` — output file name. Defaults to `agentlens-report.html`.

See `.agentlens.example.json` for a full example.

---

## What It Detects

| Tool | Files |
|---|---|
| Claude Code | `CLAUDE.md`, `CLAUDE.local.md` |
| OpenAI Codex | `AGENTS.md` |
| Cursor | `.cursorrules`, `.cursor/rules/` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Windsurf | `.windsurfrules` |
| Aider | `CONVENTIONS.md`, `.aider.conf.yml` |
| Devin | `.devin/instructions.md`, `DEVIN.md` |

For each file found, AgentLens also resolves referenced files (`@import`, `!include`, markdown links, inline code paths) and counts their tokens — with deduplication across tools that reference the same file.

## Features

| Feature | Description |
|---|---|
| Local repo scanning | CLI reads filesystem directly — no GitHub API needed for private repos |
| Config file detection | 7 tools, 15+ file patterns |
| Reference resolution | Follows `@import`, `!include`, markdown links, inline code paths |
| Dedup logic | Shared references across multiple config files counted only once |
| Cost calculator | 20+ models across Anthropic, OpenAI, Google, Cursor, DeepSeek, Mistral, xAI |
| Team projection | Monthly cost = per-request × team size × daily chats × 22 working days |
| Compare mode | Side-by-side comparison of multiple repos with chart + sortable table |
| Baseline repos | Pre-seed the Compare tab with public repos from `.agentlens.json` |
| Bilingual UI | English / Portuguese toggle |

## Context Engineering

This tool was built as a companion to a course on **Context Engineering** — the practice of intentionally designing what AI agents load into their context window to balance capability, cost, and performance.

Key insight: `CLAUDE.md`, `AGENTS.md`, and similar files are loaded on **every single request**. A 10,000-token instruction file used by a 10-person team making 20 requests/day costs ~$50–300/month depending on the model — before any actual work happens.

AgentLens makes that cost visible so teams can make informed decisions about what belongs in always-on context vs. skills, rules, or on-demand retrieval.

## Files

```
agentlens/
├── agentlens.html              # Web app + HTML report template (standalone)
├── agentlens-core.js           # Shared analysis module (browser + Node.js)
├── cli.js                      # CLI entry point
├── package.json
└── .agentlens.example.json     # Example workspace config
```

## License

MIT
