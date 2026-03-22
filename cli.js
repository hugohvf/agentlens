#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');
const { analyzeLocalRepo, AGENT_TOOLS, fmtTok } = require('./agentlens-core');

const VERSION = '1.0.0';

// ══════════════════════════════════════
// ARG PARSER
// ══════════════════════════════════════
function parseArgs(argv) {
  const args = { paths: [], config: null, out: null, open: false, stdout: false, version: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--version' || a === '-v') { args.version = true; }
    else if (a === '--open')  { args.open = true; }
    else if (a === '--stdout'){ args.stdout = true; }
    else if ((a === '--path' || a === '-p') && argv[i + 1]) { args.paths.push(argv[++i]); }
    else if ((a === '--out'  || a === '-o') && argv[i + 1]) { args.out = argv[++i]; }
    else if ((a === '--config'|| a === '-c') && argv[i + 1]){ args.config = argv[++i]; }
    else if (!a.startsWith('-')) { args.paths.push(a); }
  }
  return args;
}

// ══════════════════════════════════════
// CONFIG FILE READER
// ══════════════════════════════════════
function loadConfig(configPath) {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// ══════════════════════════════════════
// RESOLVE REPOS TO SCAN
// ══════════════════════════════════════
function resolveRepos(args) {
  // Priority 1: --path flags
  if (args.paths.length > 0) {
    return {
      repos: args.paths.map(p => ({
        path: path.resolve(p),
        name: path.basename(path.resolve(p)),
      })),
      baselines: [],
      output: args.out || 'agentlens-report.html',
    };
  }

  // Priority 2: .agentlens.json
  const configFile = args.config
    ? path.resolve(args.config)
    : path.resolve('.agentlens.json');

  if (fs.existsSync(configFile)) {
    const cfg = loadConfig(configFile);
    if (cfg) {
      const configDir = path.dirname(configFile);
      const repos = (cfg.repos || [{ path: '.' }]).map(r => ({
        path: path.resolve(configDir, r.path || '.'),
        name: r.name || path.basename(path.resolve(configDir, r.path || '.')),
      }));
      return {
        repos,
        baselines: cfg.baselines || [],
        output: args.out || cfg.output || 'agentlens-report.html',
      };
    }
  }

  // Priority 3: default — scan current directory
  return {
    repos: [{ path: path.resolve('.'), name: path.basename(path.resolve('.')) }],
    baselines: [],
    output: args.out || 'agentlens-report.html',
  };
}

// ══════════════════════════════════════
// TERMINAL SUMMARY PRINTER
// ══════════════════════════════════════
function printSummary(results) {
  for (const r of results) {
    console.error('');
    if (!r.ok || r.noFiles) {
      console.error(`  ${r.repoName} (${r.localPath})`);
      console.error(`  └── No AI agent config files found`);
      continue;
    }

    const foundTools = AGENT_TOOLS.filter(t => r.foundByTool[t.id]);
    console.error(`  ${r.repoName} (${r.localPath})`);
    for (const tool of foundTools) {
      const tok = Math.round(r.foundByTool[tool.id].content.length / 4);
      console.error(`  ├── ${r.foundByTool[tool.id].path.padEnd(35)} ${fmtTok(tok)} tokens`);
    }
    const foundRefs  = r.uniqueRefs.filter(x => x.found);
    const missingRefs = r.uniqueRefs.filter(x => !x.found);
    if (r.uniqueRefs.length > 0) {
      console.error(`  ├── refs: ${foundRefs.length} resolved, ${missingRefs.length} missing (+${fmtTok(r.refTok)} tokens)`);
    }
    console.error(`  └── Total context: ${fmtTok(r.totalContextTokens)} tokens`);
  }
  console.error('');
}

// ══════════════════════════════════════
// HTML REPORT GENERATOR
// ══════════════════════════════════════
function generateReport(seedData, outputPath) {
  const templatePath = path.join(__dirname, 'agentlens.html');
  const corePath     = path.join(__dirname, 'agentlens-core.js');

  if (!fs.existsSync(templatePath)) {
    throw new Error(`agentlens.html not found at ${templatePath}`);
  }

  let html = fs.readFileSync(templatePath, 'utf8');

  // Inline agentlens-core.js if it exists (makes report fully self-contained)
  if (fs.existsSync(corePath)) {
    const coreJs = fs.readFileSync(corePath, 'utf8');
    html = html.replace('</head>', `<script>\n${coreJs}\n</script>\n</head>`);
  }

  // Inject preseed data
  const seedJson = JSON.stringify(seedData);
  html = html.replace('</head>', `<script>window.AGENTLENS_LOCAL_DATA = ${seedJson};</script>\n</head>`);

  fs.writeFileSync(outputPath, html, 'utf8');
}

// ══════════════════════════════════════
// OPEN IN BROWSER
// ══════════════════════════════════════
function openBrowser(filePath) {
  const absPath = path.resolve(filePath);
  const { execSync } = require('child_process');
  try {
    const cmd = process.platform === 'win32' ? `start "" "${absPath}"` :
                process.platform === 'darwin' ? `open "${absPath}"` :
                `xdg-open "${absPath}"`;
    execSync(cmd);
  } catch (e) { /* silently ignore */ }
}

// ══════════════════════════════════════
// MAIN
// ══════════════════════════════════════
async function main() {
  const args = parseArgs(process.argv);

  if (args.version) {
    console.log(`agentlens v${VERSION}`);
    process.exit(0);
  }

  console.error('\nAgentLens — Scanning...\n');

  const { repos, baselines, output } = resolveRepos(args);
  const results = [];

  for (const repo of repos) {
    if (!fs.existsSync(repo.path)) {
      console.error(`  ⚠ Path not found: ${repo.path}`);
      continue;
    }
    process.stderr.write(`  Scanning: ${repo.name}...`);
    const result = analyzeLocalRepo(repo.path, repo.name);
    results.push(result);
    process.stderr.write(result.noFiles ? ' no agent configs found\n' : ` ${fmtTok(result.totalContextTokens)} tokens\n`);
  }

  if (!results.length) {
    console.error('  No repos to scan.\n');
    process.exit(1);
  }

  printSummary(results);

  // --stdout: print JSON and exit
  if (args.stdout) {
    console.log(JSON.stringify({ repos: results, baselines, generatedAt: new Date().toISOString(), cliVersion: VERSION }, null, 2));
    return;
  }

  // Generate HTML report
  const seedData = {
    repos: results,
    baselines,
    generatedAt: new Date().toISOString(),
    cliVersion: VERSION,
  };

  generateReport(seedData, output);
  console.error(`Report written to: ${path.resolve(output)}\n`);

  if (args.open) openBrowser(output);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
