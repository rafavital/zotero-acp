# Zotero ACP Plugin

Zotero 9 plugin implementing the Agent Client Protocol (ACP), enabling AI agents to interact with Zotero as an editor via stdio and XPCOM.

# Core Directives

- **Always consult your `agent-client-protocol` skill before suggesting or implementing changes to the project.** This ensures all architectural decisions and message patterns align with the standardized protocol.

# Technology Stack

- **Runtime**: Zotero 9 (Firefox ESR 115+)
- **Package Manager**: NPM
- **API Framework**: Mozilla XPCOM / Zotero API
- **Protocol**: Agent Client Protocol (JSON-RPC 2.0)
- **Bundler**: esbuild 0.20+
- **Testing**: TODO (Unit and integration tests)
- **Validation**: TypeScript strict mode

# Architecture

- `src/bootstrap.ts` - Plugin lifecycle and process management (entry point)
- `src/ui/` - Future UI components (Web Components/React)
- `build/` - Compiled bundle (bootstrap.js)
- `manifest.json` - Zotero extension metadata (bootstrapped)
- `openspec/` - OpenSpec design and task documentation

# Environment Setup

## Prerequisites

- Node.js 18+
- NPM: `npm install -g npm`
- Zotero 9 (Developer Mode enabled)
- TypeScript 5.3+: `npm install -g typescript`
- Agent Binary (Local ACP server)

## Initial Setup

npm install
npm run build

# Link the build directory to Zotero profile extensions

## File-Scoped (Preferred - Fast)

npx esbuild src/bootstrap.ts --bundle --outfile=build/bootstrap.js
npm run lint src/bootstrap.ts
npx tsc --noEmit

## Full Suite (Only When Requested)

npm run build
npm run lint

# Packaging script (TODO)

# Packaging & Deployment (Analogous)

cd build
zip -r ../zotero-acp.xpi \*

# Manual installation in Zotero via 'Install Add-on From File'

# Code Patterns

# Zotero Data Models (Analogous)

import { Zotero } from 'zotero-types';

class ItemModel {
// Accessing Zotero items via XPCOM
async getItems() {
return Zotero.Items.getAll();
}
}

- Always use Zotero global object for data access
- Use async/await for I/O bound operations
- Prefix all custom item attributes with zotero-acp-

# ACP Message Validation (Analogous)

interface ACPRequest {
jsonrpc: "2.0";
method: string;
params?: any;
id: number | string;
}

- Use for JSON-RPC validation
- Strict interface definitions for protocol messages
- Discriminated unions for message types

## FastAPI + Lambda

# Zotero XPCOM + ACP (Analogous)

const Subprocess = Components.utils.import("resource://gre/modules/Subprocess.jsm").Subprocess;

async function startAgent() {
const proc = await Subprocess.call({
command: "/path/to/agent",
arguments: ["--acp"]
});
return proc;
}

- Keep bootstrap hooks thin
- Async for subprocess communication
- Initialize agents in startup(), kill in shutdown()

# Testing

## Structure

tests/
├── unit/ # Mocked Zotero/XPCOM
├── integration/ # Real Zotero environment
└── conftest.py # (TODO: Adapt to TS/Jest)

## Running Tests

npm test # Fast, mocked

# Manual verification in Zotero console

# UI testing via Zotero window injection

## Requirements

- 80%+ coverage for protocol logic
- Unit tests for JSON-RPC parsing
- Integration tests for agent handshake
- No errors in Zotero Error Console (Ctrl+Shift+J)

# Terraform

# Build & Release (Analogous)

npm run build

# Update manifest.json version

# Generate update.json for Zotero auto-update

# Tag release in GitHub

## Best Practices

- Store state in Zotero Preferences (Zotero.Prefs)
- Use Namespacing for all keys: extensions.zotero-acp.\*
- Tag all UI elements: class="zotero-acp-..."
- Always run lint before committing
- Document all XPCOM interfaces used

# Security

## Secrets Management

- Production: Environment Variables or Zotero Prefs (encrypted)
- Development: .env (gitignored)
- CI/CD: GitHub Actions Secrets
- Never commit agent API keys or credentials

## Security Scanning

npm audit # Dependency vulnerabilities

# Static analysis for XPCOM/Privileged code

## AWS Security

# Zotero/Mozilla Security (Analogous)

- Use Principle of Least Privilege for XPCOM
- Isolate agent communication to local stdio
- Sanitize all data received from agent before UI injection
- VPC (Not Applicable)

# Deployment

## Local Development

npm run watch

# Automatic reload in Zotero (via dev extension)

## Infrastructure

# Not Applicable (Local Plugin)

# Target: Zotero 9 (Firefox 115 ESR)

## CI/CD

- Workflow: `.github/workflows/package.yml`
- Staging: Automatic .xpi generation on branch
- Production: Release tagging and update.json update
- Gates: Linting pass, build successful, manual QA

# Code Style

- TypeScript: Strict mode, type hints (ES2022)
- Formatting: 2 spaces, semi-colons required
- Imports: Group Zotero, XPCOM, local modules
- Docstrings: JSDoc style
- Never hardcode binary paths or library IDs

# Good Examples

- Lifecycle: `src/bootstrap.ts`
- Build Config: `esbuild.mjs`
- Extension Metadata: `manifest.json`

# Avoid

- Synchronous I/O in the main thread
- Hardcoded paths to agents or binaries
- Incomplete cleanup of UI elements in shutdown()

# Permissions

## Allowed Without Prompting

- Read/Write project files
- Build and Lint commands
- Type checking (tsc)

## Require Approval

- Executing external binaries (Agents)
- Modifying Zotero preferences
- Deleting user data or library items
- Network access (outside localhost)

# Troubleshooting

## Lambda Timeout

# Zotero Main Thread Block (Analogous)

- Move heavy logic to worker threads or subprocesses
- Use async/await for all ACP communication

## PynamoDB Can't Find Table

# Zotero Preference Missing (Analogous)

- Check default preferences in defaults/preferences/
- Verify namespacing: extensions.zotero-acp.agentPath

## Terraform State Lock

# Zotero Lock File (Analogous)

- Remove .parentlock if Zotero crashes
- Check profile lock in Zotero profile directory

# Additional Resources

- Zotero Dev Docs: https://www.zotero.org/support/dev/
- ACP Specification: https://agentclientprotocol.com/
- Mozilla Subprocess API: https://archive.mozilla.org/
- Zotero Plugin Toolkit: https://github.com/windingwind/zotero-plugin-toolkit
