/**
 * UI Management for Zotero ACP Plugin.
 * Handles the Item Pane section registration.
 */

declare const Zotero: any;

export class ACPUI {
  private sectionID: string | null = null;

  constructor(private pluginID: string) {}

  /**
   * Registers the ACP section in the Zotero Item Pane.
   */
  register() {
    if (this.sectionID) return;

    this.sectionID = Zotero.ItemPaneManager.registerSection({
      paneID: "zotero-acp-section",
      pluginID: this.pluginID,
      header: {
        l10nID: "zotero-acp-item-pane-header",
        icon: "chrome://zotero/skin/16/universal/robot.svg", // Using a built-in icon as placeholder
      },
      sidenav: {
        l10nID: "zotero-acp-item-pane-sidenav",
        icon: "chrome://zotero/skin/16/universal/robot.svg",
      },
      onRender: ({ body, item, editable, tabType }: any) => {
        this.render(body, item);
      },
    });
  }

  /**
   * Unregisters the section.
   */
  unregister() {
    if (this.sectionID) {
      Zotero.ItemPaneManager.unregisterSection(this.sectionID);
      this.sectionID = null;
    }
  }

  /**
   * Renders the chat interface inside the provided body element.
   */
  private render(body: HTMLElement, item: any) {
    const doc = body.ownerDocument;
    body.replaceChildren();

    const container = doc.createElement("div");
    container.id = "zotero-acp-ui-container";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.height = "100%";
    container.style.padding = "8px";
    container.style.boxSizing = "border-box";

    const chatHistory = doc.createElement("div");
    chatHistory.id = "zotero-acp-chat-history";
    chatHistory.style.flex = "1";
    chatHistory.style.overflowY = "auto";
    chatHistory.style.border = "1px solid var(--border-color, #ccc)";
    chatHistory.style.borderRadius = "4px";
    chatHistory.style.padding = "8px";
    chatHistory.style.backgroundColor = "var(--fill-main, #f9f9f9)";
    chatHistory.style.fontSize = "12px";
    chatHistory.style.marginBottom = "8px";
    chatHistory.style.minHeight = "200px";

    const inputArea = doc.createElement("div");
    inputArea.style.display = "flex";
    inputArea.style.gap = "4px";

    const input = doc.createElement("input");
    input.type = "text";
    input.style.flex = "1";
    input.style.padding = "4px 8px";
    input.placeholder = Zotero.Intl.getString("zotero-acp-chat-placeholder") || "Type a message...";
    
    const sendBtn = doc.createElement("button");
    sendBtn.textContent = Zotero.Intl.getString("zotero-acp-send-button") || "Send";
    sendBtn.style.padding = "4px 12px";
    
    const restartBtn = doc.createElement("button");
    restartBtn.textContent = "Restart"; // TODO: Localize
    restartBtn.style.padding = "4px 8px";
    restartBtn.style.fontSize = "10px";
    
    sendBtn.onclick = () => {
      const text = input.value.trim();
      if (text) {
        this.addMessageToHistory(chatHistory, "user", text);
        input.value = "";
        
        // Dispatch structured event
        const event = new doc.defaultView.CustomEvent("zotero-acp-send-prompt", {
          detail: { 
            prompt: text, 
            itemID: item?.id,
            timestamp: Date.now()
          }
        });
        doc.dispatchEvent(event);
      }
    };

    restartBtn.onclick = () => {
      if (confirm("Are you sure you want to restart the AI agent?")) {
        this.addMessageToHistory(chatHistory, "system", "Restarting agent...");
        const event = new doc.defaultView.CustomEvent("zotero-acp-restart-agent");
        doc.dispatchEvent(event);
      }
    };

    input.onkeydown = (e) => {
      if (e.key === "Enter") sendBtn.click();
    };

    inputArea.appendChild(input);
    inputArea.appendChild(sendBtn);
    inputArea.appendChild(restartBtn);

    container.appendChild(chatHistory);
    container.appendChild(inputArea);
    body.appendChild(container);

    // Initial message
    if (item) {
      this.addMessageToHistory(chatHistory, "system", `Context: ${item.getField('title')}`);
    } else {
      this.addMessageToHistory(chatHistory, "system", "No item selected.");
    }
  }

  private addMessageToHistory(history: HTMLElement, sender: 'user' | 'agent' | 'system', text: string) {
    const doc = history.ownerDocument;
    const msg = doc.createElement("div");
    msg.style.marginBottom = "6px";
    msg.style.lineHeight = "1.4";
    
    const colors = {
      user: "var(--text-main, #333)",
      agent: "#0056b3",
      system: "#666"
    };

    const label = sender.charAt(0).toUpperCase() + sender.slice(1);
    
    const boldSender = doc.createElement("strong");
    boldSender.textContent = `${label}: `;
    boldSender.style.color = colors[sender];
    
    msg.appendChild(boldSender);
    const textNode = doc.createTextNode(text);
    msg.appendChild(textNode);
    
    history.appendChild(msg);
    history.scrollTop = history.scrollHeight;
  }
}
