/**
 * ACP Transport layer using Zotero's Subprocess API.
 * Handles the lifecycle of the agent process and communication via stdio.
 */

declare const ChromeUtils: any;

// Import Subprocess JSM (Available in Zotero 7/9)
const { Subprocess } = ChromeUtils.import('resource://gre/modules/Subprocess.jsm');

export interface ACPMessage {
  jsonrpc: "2.0";
  method?: string;
  params?: any;
  result?: any;
  error?: any;
  id?: number | string;
}

export class ACPTransport {
  private process: any = null;
  private onMessageCallback: (msg: ACPMessage) => void = () => {};

  constructor(private binaryPath: string, private args: string[] = ["--acp"]) {}

  /**
   * Starts the agent process and begins listening for messages.
   */
  async start() {
    try {
      this.process = await Subprocess.call({
        command: this.binaryPath,
        arguments: this.args,
      });

      this.readLoop();
      return true;
    } catch (e) {
      console.error("Zotero ACP: Failed to start agent process", e);
      return false;
    }
  }

  /**
   * Sends a JSON-RPC message to the agent.
   */
  async send(message: ACPMessage) {
    if (!this.process || !this.process.stdin) {
      throw new Error("Process not started or stdin not available");
    }

    const payload = JSON.stringify(message) + "\n";
    await this.process.stdin.write(payload);
  }

  /**
   * Register a callback for incoming messages.
   */
  onMessage(callback: (msg: ACPMessage) => void) {
    this.onMessageCallback = callback;
  }

  /**
   * Internal loop to read messages from stdout.
   */
  private async readLoop() {
    let buffer = "";
    try {
      while (this.process) {
        const chunk = await this.process.stdout.readString();
        if (!chunk) break;

        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const msg = JSON.parse(line);
              this.onMessageCallback(msg);
            } catch (e) {
              console.error("Zotero ACP: Failed to parse message", line, e);
            }
          }
        }
      }
    } catch (e) {
      console.error("Zotero ACP: stdout read error", e);
    }
  }

  /**
   * Kills the process and cleans up.
   */
  async stop() {
    if (this.process) {
      try {
        await this.process.kill();
      } catch (e) {
        // Process might already be dead
      }
      this.process = null;
    }
  }
}
