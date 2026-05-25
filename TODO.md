# Zotero ACP TODO

Long-term task list and roadmap for the Zotero Agent Client Protocol plugin.

## 🟢 Priority: High (Core Functionality)

- [ ] **Preferences UI**: Implement an `.xhtml` options page for configuring `agentPath`, `agentArgs`, and `autoStart` (currently only accessible via `about:config`).
- [ ] **PDF Text Extraction**: Implement a tool (e.g., `read_attachment_text`) to extract text from PDF attachments linked to Zotero items.
- [ ] **MCP Server Integration**: Expose Zotero's internal API as a Model Context Protocol (MCP) server for enhanced agent discovery and capability sharing.

## 🟡 Priority: Medium (UX & Robustness)

- [ ] **Chat Persistence**: Store chat history in Zotero's database or a local file so it survives Zotero restarts.
- [ ] **Connection Recovery**: Implement automatic reconnection/restart logic if the agent process crashes multiple times.
- [ ] **Multi-Session Support**: Allow independent chat sessions per Zotero item.

## 🔵 Priority: Low (Technical Debt & DX)

- [ ] **Testing Framework**: Set up a unit testing environment (e.g., Vitest with XPCOM mocks).
- [ ] **Documentation**: Complete the README.md with detailed installation and troubleshooting guides.
- [ ] **Packaging Script**: Create a script to automatically generate the `.xpi` package for distribution.

---

## ✅ Completed

- [x] Initial Project Setup (TypeScript, esbuild)
- [x] ACP Transport Layer (stdio/Subprocess)
- [x] ACP Handshake (initialize/initialized)
- [x] Basic Item Pane UI with Chat Interface
- [x] Enriched Context for Session Prompts
- [x] Tool Dispatcher for `read_metadata` and `search_items`
- [x] Mock Agent for development and verification
