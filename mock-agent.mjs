/**
 * Mock ACP Agent for testing Zotero ACP Plugin.
 * Implements basic JSON-RPC 2.0 over stdio.
 */

import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

rl.on('line', (line) => {
  if (!line.trim()) return;

  try {
    const msg = JSON.parse(line);
    
    // Handle initialize
    if (msg.method === 'initialize') {
      send({
        jsonrpc: "2.0",
        id: msg.id,
        result: {
          protocolVersion: "1.0.0",
          capabilities: {
            agent: { name: "MockAgent", version: "0.1.0" },
            tools: ["read_metadata", "search_items"]
          }
        }
      });
      return;
    }

    // Handle session/prompt
    if (msg.method === 'session/prompt') {
      const { prompt, context } = msg.params;
      
      // Send a few text_delta updates to simulate streaming
      setTimeout(() => {
        send({
          jsonrpc: "2.0",
          method: "session/update",
          params: {
            update: {
              type: "text_delta",
              delta: "I received your prompt: "
            }
          }
        });
      }, 500);

      setTimeout(() => {
        send({
          jsonrpc: "2.0",
          method: "session/update",
          params: {
            update: {
              type: "text_delta",
              delta: `"${prompt}". `
            }
          }
        });
      }, 1000);

      setTimeout(() => {
        if (context && context.item) {
          send({
            jsonrpc: "2.0",
            method: "session/update",
            params: {
              update: {
                type: "text",
                text: `You are currently looking at "${context.item.title}".`
              }
            }
          });
        }
        
        // Final response
        send({
          jsonrpc: "2.0",
          id: msg.id,
          result: {
            content: [{ type: "text", text: "How else can I help you today?" }]
          }
        });
      }, 1500);
      
      return;
    }

    // Default response for other methods
    if (msg.id) {
      send({
        jsonrpc: "2.0",
        id: msg.id,
        result: "Acknowledged"
      });
    }

  } catch (e) {
    // console.error(e);
  }
});

console.error("Mock Agent started...");
