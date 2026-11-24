const http = require("http");
const WebSocket = require("ws");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const PORT = process.env.WS_PORT || 1234;
const docs = new Map();

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("CollabSpace Yjs WebSocket Server Running");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (conn, req) => {
  // Extract document ID from room URL
  const roomName = req.url.slice(1) || "default";
  const docId = roomName.startsWith("doc-") ? roomName.replace("doc-", "") : roomName;
  
  console.log(`⚡ Client connected to room: ${roomName}`);

  if (!docs.has(roomName)) {
    docs.set(roomName, {
      clients: new Set(),
      saveTimeout: null,
    });
  }

  const room = docs.get(roomName);
  room.clients.add(conn);

  conn.on("message", (message) => {
    // 1. Relay real-time binary updates to all connected browser sessions
    for (const client of room.clients) {
      if (client !== conn && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }

    // 2. Debounced save to PostgreSQL page record
    if (room.saveTimeout) clearTimeout(room.saveTimeout);
    
    room.saveTimeout = setTimeout(async () => {
      try {
        if (docId && docId !== "default") {
          await prisma.page.update({
            where: { id: docId },
            data: { updatedAt: new Date() },
          });
          console.log(`💾 Persisted active state for Page ID: ${docId}`);
        }
      } catch (err) {
        console.error(`Failed to update DB for doc ${docId}:`, err.message);
      }
    }, 2000);
  });

  conn.on("close", () => {
    console.log(`❌ Client disconnected from room: ${roomName}`);
    room.clients.delete(conn);
    if (room.clients.size === 0) {
      if (room.saveTimeout) clearTimeout(room.saveTimeout);
      docs.delete(roomName);
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ CollabSpace WebSocket Server running on ws://127.0.0.1:${PORT}`);
});