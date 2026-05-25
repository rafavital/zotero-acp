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
  private onExitCallback: (exitCode: number) => void = () => {};

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
      this.monitorExit();
      return true;
    } catch (e) {
      console.error("Zotero ACP: Failed to start agent process", e);
      return false;
    }
  }

  private async monitorExit() {
    try {
      const { exitCode } = await this.process.wait();
      Zotero.debug(`Zotero ACP: Agent process exited with code ${exitCode}`);
      this.onExitCallback(exitCode);
    } catch (e) {
      Zotero.error("Zotero ACP: Error waiting for process exit", e);
    } finally {
      this.process = null;
    }
  }

  /**
   * Register a callback for when the process exits.
   */
  onExit(callback: (exitCode: number) => void) {
    this.onExitCallback = callback;
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
        if (chunk === null) break;

        buffer += chunk;
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);

          if (line) {
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
      // Avoid logging error if process was intentionally stopped
      if (this.process) {
        console.error("Zotero ACP: stdout read error", e);
      }
    }
  }

  /**
   * Kills the process and cleans up.
   */
  async stop() {
    if (this.process) {
      try {
        this.onExitCallback = () => {}; // Prevent exit handler from firing
        await this.process.kill();
      } catch (e) {
        // Process might already be dead
      }
      this.process = null;
    }
  }
}
