/**
 * Zotero ACP Plugin - Bootstrap
 * Follows the bootstrapped plugin architecture for Zotero 7/9.
 */

import { ACPTransport } from './transport';
import { ACPUI } from './ui';

declare const Zotero: any;
declare const Services: any;

let transport: ACPTransport | null = null;
let ui: ACPUI | null = null;
let pluginID: string = "";
let isInitialized: boolean = false;
let agentCapabilities: any = null;

/**
 * Called when the plugin is installed.
 */
export function install(data: any, reason: number) {
  Zotero.debug("Zotero ACP: Plugin installed");
}

/**
 * Called when the plugin is started.
 */
export async function startup({ id, version, resourceURI, rootURI }: any, reason: number) {
  Zotero.debug("Zotero ACP: Plugin starting up");
  pluginID = id;

  // Initialize UI
  ui = new ACPUI(pluginID);
  ui.register();

  // Handle outgoing messages from UI to Agent
  const windowMediator = Services.wm;
  const windows = windowMediator.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    const window = windows.getNext();
    setupWindowEventListeners(window);
  }

  // Monitor new windows
  Zotero.uiReadyPromise.then(() => {
    Zotero.ZoteroPane.addCallback(({ window, type }: any) => {
      if (type === 'load') {
        setupWindowEventListeners(window);
      }
    });
  });

  await startAgent();
}

async function startAgent() {
  const agentPath = Zotero.Prefs.get("extensions.zotero-acp.agentPath");
  const agentArgsString = Zotero.Prefs.get("extensions.zotero-acp.agentArgs");
  const autoStart = Zotero.Prefs.get("extensions.zotero-acp.autoStart");

  if (autoStart && agentPath) {
    const args = agentArgsString ? agentArgsString.split(" ") : ["--acp"];
    transport = new ACPTransport(agentPath, args);
    
    transport.onMessage((msg) => {
      Zotero.debug("Zotero ACP: Received message from agent: " + JSON.stringify(msg));
      handleAgentMessage(msg);
    });

    transport.onExit((exitCode) => {
      Zotero.error(`Zotero ACP: Agent process terminated unexpectedly with code ${exitCode}`);
      isInitialized = false;
      notifyUI("System: Agent process disconnected.", "system");
    });

    const started = await transport.start();
    if (started) {
      Zotero.debug("Zotero ACP: Agent process started successfully");
      isInitialized = false;
      
      await transport.send({
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          protocolVersion: "1.0.0",
          capabilities: {
            editor: {
              name: "Zotero",
              version: Zotero.version
            }
          }
        },
        id: "initialize"
      });
    } else {
      Zotero.error("Zotero ACP: Failed to start agent process at " + agentPath);
    }
  }
}

function setupWindowEventListeners(window: Window) {
  window.document.addEventListener("zotero-acp-restart-agent", async () => {
    Zotero.debug("Zotero ACP: Restarting agent as requested by UI");
    if (transport) {
      await transport.stop();
      transport = null;
    }
    isInitialized = false;
    await startAgent();
  });

  window.document.addEventListener("zotero-acp-send-prompt", async (e: any) => {
    const { prompt, itemID } = e.detail;
    if (transport && isInitialized) {
      Zotero.debug(`Zotero ACP: Sending prompt to agent for item ${itemID}: ${prompt}`);
      
      let context: any = {};
      if (itemID) {
        const item = await Zotero.Items.getAsync(itemID);
        if (item) {
          context.item = {
            id: item.id,
            key: item.key,
            libraryID: item.libraryID,
            title: item.getField('title'),
            date: item.getField('date'),
            itemType: Zotero.ItemTypes.getName(item.itemTypeID),
            creators: item.getCreators().map((c: any) => ({
              firstName: c.firstName,
              lastName: c.lastName,
              creatorType: Zotero.CreatorTypes.getName(c.creatorTypeID)
            }))
          };
        }
      }

      await transport.send({
        jsonrpc: "2.0",
        method: "session/prompt",
        params: {
          prompt: prompt,
          context: context
        },
        id: Date.now()
      });
    } else if (!isInitialized) {
      Zotero.error("Zotero ACP: Agent not initialized yet.");
      notifyUI("System: Agent not initialized yet.", "system");
    } else {
      Zotero.error("Zotero ACP: Agent not started. Cannot send prompt.");
      notifyUI("System: Agent not started.", "system");
    }
  });
}

async function handleAgentMessage(msg: any) {
  // Handle Initialization Response
  if (msg.id === "initialize") {
    if (msg.result) {
      agentCapabilities = msg.result.capabilities;
      isInitialized = true;
      Zotero.debug("Zotero ACP: Handshake complete. Agent capabilities: " + JSON.stringify(agentCapabilities));
      
      // Send initialized notification
      if (transport) {
        await transport.send({
          jsonrpc: "2.0",
          method: "initialized",
          params: {}
        });
      }
      notifyUI("System: Agent initialized and ready.", "system");
    } else if (msg.error) {
      Zotero.error("Zotero ACP: Initialization failed: " + msg.error.message);
      notifyUI(`System: Initialization failed: ${msg.error.message}`, "system");
    }
    return;
  }

  // Handle Tool Calls from Agent
  if (msg.method === "tools/call") {
    await handleToolCall(msg);
    return;
  }

  // Handle ACP session updates
  if (msg.method === "session/update") {
    const update = msg.params?.update;
    if (!update) return;

    switch (update.type) {
      case "text_delta":
        notifyUI(update.delta, "agent");
        break;
      case "text":
        notifyUI(update.text, "agent");
        break;
      case "tool_call":
        notifyUI(`System: Agent is calling tool: ${update.title || update.toolCallId} (${update.status})`, "system");
        break;
      default:
        Zotero.debug("Zotero ACP: Received unhandled update type: " + update.type);
    }
    return;
  }

  // Handle final response results
  if (msg.result && !msg.id?.toString().startsWith("initialize")) {
    if (msg.result.content) {
      for (const block of msg.result.content) {
        if (block.type === "text") {
          notifyUI(block.text, "agent");
        }
      }
    } else if (typeof msg.result === 'string') {
      notifyUI(msg.result, "agent");
    }
  }

  // Handle Errors
  if (msg.error) {
    notifyUI(`Error: ${msg.error.message}`, "system");
  }
}

async function handleToolCall(msg: any) {
  const { name, arguments: args } = msg.params;
  Zotero.debug(`Zotero ACP: Agent calling tool ${name} with args: ${JSON.stringify(args)}`);

  let result: any = null;
  let error: any = null;

  try {
    switch (name) {
      case "read_metadata":
        const item = await Zotero.Items.getAsync(args.itemID);
        if (item) {
          result = {
            title: item.getField('title'),
            abstract: item.getField('abstractNote'),
            tags: item.getTags().map((t: any) => t.tag)
          };
        } else {
          error = { code: -32602, message: "Item not found" };
        }
        break;

      case "search_items":
        const s = new Zotero.Search();
        s.addCondition('title', 'contains', args.query);
        const ids = await s.search();
        result = { items: ids };
        break;

      default:
        error = { code: -32601, message: `Tool not found: ${name}` };
    }
  } catch (e: any) {
    error = { code: -32603, message: e.message };
  }

  if (transport) {
    await transport.send({
      jsonrpc: "2.0",
      id: msg.id,
      result,
      error
    });
  }
}

function notifyUI(text: string, sender: 'user' | 'agent' | 'system' = 'agent') {
  const windowMediator = Services.wm;
  const windows = windowMediator.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    const window = windows.getNext();
    const container = window.document.getElementById("zotero-acp-chat-history");
    if (container) {
      const msgDiv = window.document.createElement("div");
      msgDiv.style.marginBottom = "6px";
      msgDiv.style.lineHeight = "1.4";
      
      const colors = {
        user: "var(--text-main, #333)",
        agent: "#0056b3",
        system: "#666"
      };

      const label = sender.charAt(0).toUpperCase() + sender.slice(1);
      
      const boldSender = window.document.createElement("strong");
      boldSender.textContent = `${label}: `;
      boldSender.style.color = colors[sender];
      
      msgDiv.appendChild(boldSender);
      msgDiv.appendChild(window.document.createTextNode(text));
      
      container.appendChild(msgDiv);
      container.scrollTop = container.scrollHeight;
    }
  }
}

/**
 * Called when the plugin is shut down.
 */
export async function shutdown(data: any, reason: number) {
  Zotero.debug("Zotero ACP: Plugin shutting down");

  if (ui) {
    ui.unregister();
    ui = null;
  }

  if (transport) {
    await transport.stop();
    transport = null;
  }
}

/**
 * Called when the plugin is uninstalled.
 */
export function uninstall(data: any, reason: number) {
  Zotero.debug("Zotero ACP: Plugin uninstalled");
}
