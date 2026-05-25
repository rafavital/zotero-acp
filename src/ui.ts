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
    container.style.gap = "8px";
    container.style.padding = "10px";

    const chatHistory = doc.createElement("div");
    chatHistory.id = "zotero-acp-chat-history";
    chatHistory.style.flex = "1";
    chatHistory.style.minHeight = "150px";
    chatHistory.style.maxHeight = "400px";
    chatHistory.style.overflowY = "auto";
    chatHistory.style.border = "1px solid #ccc";
    chatHistory.style.padding = "5px";
    chatHistory.style.backgroundColor = "#f9f9f9";
    chatHistory.style.fontSize = "12px";

    const inputArea = doc.createElement("div");
    inputArea.style.display = "flex";
    inputArea.style.gap = "4px";

    const input = doc.createElement("input");
    input.type = "text";
    input.style.flex = "1";
    input.placeholder = Zotero.Intl.getString("zotero-acp-chat-placeholder") || "Type a message...";
    
    const sendBtn = doc.createElement("button");
    sendBtn.textContent = Zotero.Intl.getString("zotero-acp-send-button") || "Send";
    
    sendBtn.onclick = () => {
      const text = input.value.trim();
      if (text) {
        this.addMessageToHistory(chatHistory, "User", text);
        input.value = "";
        // Dispatch event for bootstrap to handle sending to agent
        const event = new doc.defaultView.CustomEvent("zotero-acp-send-prompt", {
          detail: { prompt: text, itemID: item?.id }
        });
        doc.dispatchEvent(event);
      }
    };

    input.onkeydown = (e) => {
      if (e.key === "Enter") sendBtn.click();
    };

    inputArea.appendChild(input);
    inputArea.appendChild(sendBtn);

    container.appendChild(chatHistory);
    container.appendChild(inputArea);
    body.appendChild(container);

    // Initial message
    if (item) {
      this.addMessageToHistory(chatHistory, "System", `Context: ${item.getField('title')}`);
    }
  }

  private addMessageToHistory(history: HTMLElement, sender: string, text: string) {
    const doc = history.ownerDocument;
    const msg = doc.createElement("div");
    msg.style.marginBottom = "4px";
    const boldSender = doc.createElement("strong");
    boldSender.textContent = `${sender}: `;
    msg.appendChild(boldSender);
    const textNode = doc.createTextNode(text);
    msg.appendChild(textNode);
    history.appendChild(msg);
    history.scrollTop = history.scrollHeight;
  }
}
