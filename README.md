# Zotero ACP Plugin

This plugin implements the **Agent Client Protocol (ACP)** for Zotero 9, allowing AI agents to connect to Zotero as an editor through a standardized interface.

## Technical Decisions

- **Platform:** Zotero 9 (based on Firefox ESR 115+).
- **Architecture:** _Bootstrapped Plugin_ (restartless), using `manifest.json` and `bootstrap.js`.
- **Language:** TypeScript, compiled via `esbuild` to generate assets compatible with the Mozilla engine.
- **ACP Transport:** Uses `stdio` (stdin/stdout) for communication with local agents. Subprocess management is handled via native Mozilla APIs (e.g., `Subprocess.jsm`).
- **Interface:** Dynamic UI injection into the Sidebar/Item Pane, without using XUL Overlays (deprecated).

## Project Structure

- `src/bootstrap.ts`: Entry point and plugin lifecycle management.
- `src/ui/`: Future directory for interface components (Web Components/React).
- `manifest.json`: Plugin metadata manifest.
- `esbuild.mjs`: Bundler configuration to generate the final package.

## How to Develop

1. Install dependencies: `npm install`.
2. Run the build: `npm run build`.
3. The `build/bootstrap.js` file will be generated.
4. To load in Zotero, point to the project's root directory in Zotero's developer mode or package it as an `.xpi` (zip).
