# AgentLens — AI Context Cost Scanner

**AgentLens** is a single-file web app that scans any public GitHub repository to detect AI agent configuration files, resolves their referenced dependencies, and calculates the real token cost per request across all major LLM providers.

## What it does

When you work with AI coding agents (Claude Code, OpenAI Codex, Cursor, Copilot), every session starts by loading configuration files like `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, and `copilot-instructions.md`. These files consume tokens on **every request** — and most teams have no idea how much that costs at scale.

AgentLens gives you visibility into:

- **Which agent config files exist** in a repo (CLAUDE.md, AGENTS.md, .cursorrules, copilot-instructions, and more)
- **What files they reference** (imported docs, rules, skill files, etc.) and their token counts
- **Deduplication** of shared references loaded by multiple config files
- **Real context cost per request** broken down by provider (Claude, GPT-4o, Gemini, etc.)
- **Team-wide cost projection** based on number of developers and requests per day
- **Side-by-side repo comparison** to benchmark context efficiency across projects

## How to use

AgentLens is a **zero-install, single HTML file**. No server, no build step, no dependencies to install.

1. Download `agentlens.html`
2. Open it in any modern browser (Chrome, Firefox, Safari, Edge)
3. Enter a public GitHub repository URL (e.g. `https://github.com/anthropics/claude-code`)
4. Click **Scan** and wait a few seconds

That's it. All processing happens in your browser via the GitHub API.

> **Note:** For private repositories or to avoid rate limiting, you can add a GitHub Personal Access Token in the tool's settings. No token is stored anywhere — it's kept only in memory for the session.

## Features

| Feature | Description |
|---|---|
| Config file detection | Finds CLAUDE.md, AGENTS.md, .cursorrules, copilot-instructions.md, and variants |
| Reference resolution | Follows `@import`, `!include`, and common reference patterns to load linked files |
| Token counting | Estimates token count for all detected context files |
| Dedup logic | Identifies shared references counted once across multiple config files |
| Cost calculator | Calculates cost per request across 10+ LLM provider/model combinations |
| Team projection | Multiplies per-request cost by team size × daily requests for monthly spend |
| Compare mode | Scan multiple repos and compare their context footprints side by side |
| Bilingual UI | Toggle between English and Portuguese |

## Dependencies

AgentLens has a single external dependency loaded from CDN:

- [Chart.js 4.4.1](https://www.chartjs.org/) — for cost comparison charts

No npm, no build tools, no framework. Open the file and go.

## Context Engineering

This tool was built as a companion to a course on **Context Engineering** — the practice of intentionally designing what AI agents load into their context window to balance capability, cost, and performance.

Key insight: `CLAUDE.md`, `AGENTS.md`, and similar files are loaded on **every single request**. A 10,000-token instruction file used by a 10-person team making 20 requests/day costs ~$50–300/month depending on the model — before any actual work happens.

AgentLens makes that cost visible so teams can make informed decisions about what belongs in always-on context vs. skills, rules, or on-demand retrieval.

## License

MIT
