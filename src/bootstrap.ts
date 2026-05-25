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

  // ACP Agent Management
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

    const started = await transport.start();
    if (started) {
      Zotero.debug("Zotero ACP: Agent process started successfully");
      
      await transport.send({
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          capabilities: {
            editor: {
              name: "Zotero",
              version: Zotero.version
            }
          }
        },
        id: "init-1"
      });
    } else {
      Zotero.error("Zotero ACP: Failed to start agent process at " + agentPath);
    }
  }
}

function setupWindowEventListeners(window: Window) {
  window.document.addEventListener("zotero-acp-send-prompt", async (e: any) => {
    const { prompt, itemID } = e.detail;
    if (transport) {
      Zotero.debug(`Zotero ACP: Sending prompt to agent for item ${itemID}: ${prompt}`);
      await transport.send({
        jsonrpc: "2.0",
        method: "session/prompt",
        params: {
          prompt: prompt,
          context: {
            item: itemID ? await Zotero.Items.getAsync(itemID) : null
          }
        },
        id: Date.now()
      });
    } else {
      Zotero.error("Zotero ACP: Agent not started. Cannot send prompt.");
    }
  });
}

function handleAgentMessage(msg: any) {
  // Update UI with agent responses (e.g., session/update)
  if (msg.method === "session/update" || msg.result) {
    const text = msg.params?.text || msg.result?.text || JSON.stringify(msg.result);
    // Notify UI (in all windows)
    const windowMediator = Services.wm;
    const windows = windowMediator.getEnumerator("navigator:browser");
    while (windows.hasMoreElements()) {
      const window = windows.getNext();
      const container = window.document.getElementById("zotero-acp-chat-history");
      if (container) {
        const msgDiv = window.document.createElement("div");
        msgDiv.style.marginBottom = "4px";
        msgDiv.style.color = "#0056b3";
        const boldSender = window.document.createElement("strong");
        boldSender.textContent = "Agent: ";
        msgDiv.appendChild(boldSender);
        msgDiv.appendChild(window.document.createTextNode(text));
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
      }
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
