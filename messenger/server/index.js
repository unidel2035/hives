#!/usr/bin/env node

/**
 * Messenger Server
 *
 * Main server file that provides:
 * - HTTP server for static files
 * - REST API for authentication
 * - WebSocket server for real-time messaging and signaling
 * - SQLite database for persistence
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

// Initialize database
await db.initDatabase();

// Express app setup
const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, '..', 'client')));

// ===== REST API Endpoints =====

/**
 * POST /api/register - Register a new user
 */
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await db.registerUser(username, password);
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('[API] Registration error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/login - Login existing user
 */
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await db.authenticateUser(username, password);

    // Create session token
    const sessionToken = await db.createSession(user.id, null);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username
      },
      sessionToken
    });
  } catch (error) {
    console.error('[API] Login error:', error.message);
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/validate-session - Validate session token
 */
app.post('/api/validate-session', async (req, res) => {
  try {
    const { sessionToken } = req.body;
    const session = await db.validateSession(sessionToken);

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
    }

    res.json({
      success: true,
      user: {
        id: session.userId,
        username: session.username
      }
    });
  } catch (error) {
    console.error('[API] Session validation error:', error.message);
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/messages/:roomId - Get messages from a room
 */
app.get('/api/messages/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const messages = await db.getRoomMessages(roomId, limit, offset);

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('[API] Get messages error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== WebSocket Server =====

const wss = new WebSocketServer({ server });

// Store connected clients
const clients = new Map();
const rooms = new Map();

wss.on('connection', (ws, req) => {
  const clientId = generateId();
  clients.set(clientId, {
    ws,
    userId: null,
    username: null,
    roomId: null,
    sessionToken: null
  });

  console.log(`[Server] Client connected: ${clientId}`);

  // Send initial connection confirmation
  ws.send(JSON.stringify({
    type: 'connected',
    clientId,
    timestamp: Date.now()
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(clientId, message);
    } catch (error) {
      console.error('[Server] Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format'
      }));
    }
  });

  ws.on('close', async () => {
    console.log(`[Server] Client disconnected: ${clientId}`);
    const client = clients.get(clientId);
    if (client && client.roomId) {
      leaveRoom(clientId, client.roomId);
    }
    // Clean up session
    if (client && client.sessionToken) {
      await db.deleteSession(client.sessionToken);
    }
    clients.delete(clientId);
  });

  ws.on('error', (error) => {
    console.error(`[Server] WebSocket error for ${clientId}:`, error);
  });
});

/**
 * Handle incoming messages from clients
 */
async function handleMessage(clientId, message) {
  const client = clients.get(clientId);
  if (!client) return;

  console.log(`[Server] Message from ${clientId}:`, message.type);

  switch (message.type) {
    case 'authenticate':
      await handleAuthenticate(clientId, message);
      break;

    case 'register':
      handleRegister(clientId, message.userId);
      break;

    case 'join-room':
      await handleJoinRoom(clientId, message.roomId);
      break;

    case 'leave-room':
      handleLeaveRoom(clientId);
      break;

    case 'chat-message':
      await handleChatMessage(clientId, message);
      break;

    case 'webrtc-offer':
    case 'webrtc-answer':
    case 'webrtc-ice-candidate':
      handleWebRTCSignaling(clientId, message);
      break;

    case 'call-user':
      handleCallUser(clientId, message);
      break;

    case 'call-response':
      handleCallResponse(clientId, message);
      break;

    case 'end-call':
      handleEndCall(clientId, message);
      break;

    default:
      console.log(`[Server] Unknown message type: ${message.type}`);
  }
}

/**
 * Authenticate user with session token
 */
async function handleAuthenticate(clientId, message) {
  const client = clients.get(clientId);
  if (!client) return;

  try {
    const session = await db.validateSession(message.sessionToken);

    if (!session) {
      client.ws.send(JSON.stringify({
        type: 'auth-failed',
        error: 'Invalid session token'
      }));
      return;
    }

    client.userId = session.userId;
    client.username = session.username;
    client.sessionToken = message.sessionToken;

    client.ws.send(JSON.stringify({
      type: 'authenticated',
      userId: session.userId,
      username: session.username,
      timestamp: Date.now()
    }));

    console.log(`[Server] User authenticated: ${session.username} (${clientId})`);
  } catch (error) {
    console.error('[Server] Authentication error:', error);
    client.ws.send(JSON.stringify({
      type: 'auth-failed',
      error: 'Authentication failed'
    }));
  }
}

/**
 * Register a user with a userId (legacy support)
 */
function handleRegister(clientId, userId) {
  const client = clients.get(clientId);
  if (client) {
    client.userId = userId;
    client.username = userId;
    client.ws.send(JSON.stringify({
      type: 'registered',
      userId,
      timestamp: Date.now()
    }));
    console.log(`[Server] User registered (legacy): ${userId} (${clientId})`);
  }
}

/**
 * Handle joining a chat room
 */
async function handleJoinRoom(clientId, roomId) {
  const client = clients.get(clientId);
  if (!client || !client.username) {
    client.ws.send(JSON.stringify({
      type: 'error',
      error: 'Must authenticate before joining room'
    }));
    return;
  }

  // Leave current room if in one
  if (client.roomId) {
    leaveRoom(clientId, client.roomId);
  }

  // Create room in database if it doesn't exist
  await db.createRoom(roomId);

  // Join new room
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }

  rooms.get(roomId).add(clientId);
  client.roomId = roomId;

  // Update session
  if (client.sessionToken) {
    await db.updateSessionRoom(client.sessionToken, roomId);
  }

  // Get list of users in room
  const usersInRoom = Array.from(rooms.get(roomId))
    .map(cId => clients.get(cId)?.username)
    .filter(Boolean);

  // Get message history from database
  const messages = await db.getRoomMessages(roomId, 50);

  // Notify user of successful join
  client.ws.send(JSON.stringify({
    type: 'joined-room',
    roomId,
    users: usersInRoom,
    messages, // Send history
    timestamp: Date.now()
  }));

  // Notify others in room
  broadcastToRoom(roomId, {
    type: 'user-joined',
    userId: client.username,
    timestamp: Date.now()
  }, clientId);

  console.log(`[Server] User ${client.username} joined room: ${roomId}`);
}

/**
 * Handle leaving a chat room
 */
function handleLeaveRoom(clientId) {
  const client = clients.get(clientId);
  if (client && client.roomId) {
    leaveRoom(clientId, client.roomId);
  }
}

/**
 * Leave a room (internal helper)
 */
function leaveRoom(clientId, roomId) {
  const client = clients.get(clientId);
  const room = rooms.get(roomId);

  if (room) {
    room.delete(clientId);

    // Notify others
    if (client && client.username) {
      broadcastToRoom(roomId, {
        type: 'user-left',
        userId: client.username,
        timestamp: Date.now()
      });
    }

    // Clean up empty rooms
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  }

  if (client) {
    client.roomId = null;
  }
}

/**
 * Handle chat messages
 */
async function handleChatMessage(clientId, message) {
  const client = clients.get(clientId);
  if (!client || !client.roomId) {
    client.ws.send(JSON.stringify({
      type: 'error',
      error: 'Must be in a room to send messages'
    }));
    return;
  }

  // Save message to database (if user is authenticated)
  if (client.userId) {
    try {
      await db.saveMessage(
        client.roomId,
        client.userId,
        client.username,
        message.message,
        message.encrypted || false
      );
    } catch (error) {
      console.error('[Server] Error saving message:', error);
    }
  }

  // Broadcast message to room (including sender for confirmation)
  broadcastToRoom(client.roomId, {
    type: 'chat-message',
    userId: client.username,
    message: message.message,
    encrypted: message.encrypted,
    timestamp: Date.now()
  });
}

/**
 * Handle WebRTC signaling for P2P connections
 */
function handleWebRTCSignaling(clientId, message) {
  const client = clients.get(clientId);
  if (!client || !client.roomId) return;

  const targetClient = findClientByUsername(message.targetUserId);
  if (!targetClient) {
    client.ws.send(JSON.stringify({
      type: 'error',
      error: 'Target user not found'
    }));
    return;
  }

  // Forward signaling message to target
  targetClient.ws.send(JSON.stringify({
    type: message.type,
    fromUserId: client.username,
    data: message.data,
    timestamp: Date.now()
  }));
}

/**
 * Handle initiating a call
 */
function handleCallUser(clientId, message) {
  const client = clients.get(clientId);
  if (!client || !client.username) return;

  const targetClient = findClientByUsername(message.targetUserId);
  if (!targetClient) {
    client.ws.send(JSON.stringify({
      type: 'error',
      error: 'Target user not found'
    }));
    return;
  }

  // Forward call request to target
  targetClient.ws.send(JSON.stringify({
    type: 'incoming-call',
    fromUserId: client.username,
    callType: message.callType, // 'voice' or 'video'
    timestamp: Date.now()
  }));

  console.log(`[Server] Call from ${client.username} to ${message.targetUserId}`);
}

/**
 * Handle call response (accept/reject)
 */
function handleCallResponse(clientId, message) {
  const client = clients.get(clientId);
  if (!client || !client.username) return;

  const targetClient = findClientByUsername(message.targetUserId);
  if (!targetClient) return;

  // Forward response to caller
  targetClient.ws.send(JSON.stringify({
    type: 'call-response',
    fromUserId: client.username,
    accepted: message.accepted,
    timestamp: Date.now()
  }));

  console.log(`[Server] Call response from ${client.username}: ${message.accepted ? 'accepted' : 'rejected'}`);
}

/**
 * Handle ending a call
 */
function handleEndCall(clientId, message) {
  const client = clients.get(clientId);
  if (!client || !client.username) return;

  const targetClient = findClientByUsername(message.targetUserId);
  if (!targetClient) return;

  // Notify other party
  targetClient.ws.send(JSON.stringify({
    type: 'call-ended',
    fromUserId: client.username,
    timestamp: Date.now()
  }));

  console.log(`[Server] Call ended by ${client.username}`);
}

/**
 * Helper: Broadcast message to all users in a room
 */
function broadcastToRoom(roomId, message, excludeClientId = null) {
  const room = rooms.get(roomId);
  if (!room) return;

  const messageStr = JSON.stringify(message);

  room.forEach(cId => {
    if (cId !== excludeClientId) {
      const client = clients.get(cId);
      if (client && client.ws.readyState === 1) { // OPEN
        client.ws.send(messageStr);
      }
    }
  });
}

/**
 * Helper: Find client by username
 */
function findClientByUsername(username) {
  for (const [clientId, client] of clients.entries()) {
    if (client.username === username) {
      return client;
    }
  }
  return null;
}

/**
 * Helper: Generate unique ID
 */
function generateId() {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// Cleanup old sessions periodically (every hour)
setInterval(async () => {
  try {
    await db.cleanupOldSessions(24);
    console.log('[Server] Cleaned up old sessions');
  } catch (error) {
    console.error('[Server] Error cleaning up sessions:', error);
  }
}, 60 * 60 * 1000);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down...');
  await db.closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Server] Shutting down...');
  await db.closeDatabase();
  process.exit(0);
});

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║           🚀  MESSENGER SERVER STARTED           ║
║                                                   ║
║  Server running on: http://localhost:${PORT}       ║
║                                                   ║
║  Features:                                        ║
║  ✅ User registration and authentication         ║
║  ✅ SQLite database for persistence              ║
║  ✅ WebSocket real-time messaging                ║
║  ✅ WebRTC signaling for P2P calls               ║
║  ✅ Room-based chat with history                 ║
║  ✅ Voice and video call support                 ║
║  ✅ End-to-end encryption ready                  ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});
