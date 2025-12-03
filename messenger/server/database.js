/**
 * Database Module
 *
 * Handles all database operations using SQLite
 * - User registration and authentication
 * - Message persistence
 * - Room management
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SALT_ROUNDS = 10;

let db = null;

/**
 * Initialize the database
 */
export async function initDatabase() {
  db = await open({
    filename: join(__dirname, '..', 'messenger.db'),
    driver: sqlite3.Database
  });

  await createTables();
  console.log('[Database] Database initialized');
}

/**
 * Create database tables if they don't exist
 */
async function createTables() {
  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // Rooms table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT UNIQUE NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Messages table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      message TEXT NOT NULL,
      encrypted BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Sessions table (for online tracking)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_token TEXT UNIQUE NOT NULL,
      client_id TEXT,
      room_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create indexes for performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
    CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
  `);
}

/**
 * Register a new user
 */
export async function registerUser(username, password) {
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  if (username.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Check if username already exists
  const existing = await db.get(
    'SELECT id FROM users WHERE username = ?',
    [username]
  );

  if (existing) {
    throw new Error('Username already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert user
  const result = await db.run(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)',
    [username, passwordHash]
  );

  return {
    id: result.lastID,
    username
  };
}

/**
 * Authenticate a user
 */
export async function authenticateUser(username, password) {
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  // Get user
  const user = await db.get(
    'SELECT id, username, password_hash FROM users WHERE username = ?',
    [username]
  );

  if (!user) {
    throw new Error('Invalid username or password');
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    throw new Error('Invalid username or password');
  }

  // Update last login
  await db.run(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
    [user.id]
  );

  return {
    id: user.id,
    username: user.username
  };
}

/**
 * Create or get session token for user
 */
export async function createSession(userId, clientId) {
  // Generate session token
  const sessionToken = generateToken();

  // Insert session
  await db.run(
    'INSERT INTO sessions (user_id, session_token, client_id) VALUES (?, ?, ?)',
    [userId, sessionToken, clientId]
  );

  return sessionToken;
}

/**
 * Validate session token
 */
export async function validateSession(sessionToken) {
  const session = await db.get(
    `SELECT s.*, u.username
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.session_token = ?`,
    [sessionToken]
  );

  if (!session) {
    return null;
  }

  // Update last active
  await db.run(
    'UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE session_token = ?',
    [sessionToken]
  );

  return {
    userId: session.user_id,
    username: session.username,
    clientId: session.client_id,
    roomId: session.room_id
  };
}

/**
 * Update session room
 */
export async function updateSessionRoom(sessionToken, roomId) {
  await db.run(
    'UPDATE sessions SET room_id = ?, last_active = CURRENT_TIMESTAMP WHERE session_token = ?',
    [roomId, sessionToken]
  );
}

/**
 * Delete session (logout)
 */
export async function deleteSession(sessionToken) {
  await db.run(
    'DELETE FROM sessions WHERE session_token = ?',
    [sessionToken]
  );
}

/**
 * Save a message to database
 */
export async function saveMessage(roomId, userId, username, message, encrypted = false) {
  const result = await db.run(
    'INSERT INTO messages (room_id, user_id, username, message, encrypted) VALUES (?, ?, ?, ?, ?)',
    [roomId, userId, username, message, encrypted ? 1 : 0]
  );

  return {
    id: result.lastID,
    roomId,
    userId,
    username,
    message,
    encrypted,
    timestamp: Date.now()
  };
}

/**
 * Get messages from a room
 */
export async function getRoomMessages(roomId, limit = 100, offset = 0) {
  const messages = await db.all(
    `SELECT id, room_id, user_id, username, message, encrypted,
            strftime('%s', created_at) * 1000 as timestamp
     FROM messages
     WHERE room_id = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [roomId, limit, offset]
  );

  return messages.reverse(); // Return in chronological order
}

/**
 * Create or get a room
 */
export async function createRoom(roomId, name = null) {
  // Check if room exists
  const existing = await db.get(
    'SELECT id FROM rooms WHERE room_id = ?',
    [roomId]
  );

  if (existing) {
    return existing;
  }

  // Create room
  const result = await db.run(
    'INSERT INTO rooms (room_id, name) VALUES (?, ?)',
    [roomId, name || roomId]
  );

  return {
    id: result.lastID,
    roomId,
    name: name || roomId
  };
}

/**
 * Get user by username
 */
export async function getUserByUsername(username) {
  return await db.get(
    'SELECT id, username, created_at FROM users WHERE username = ?',
    [username]
  );
}

/**
 * Get user by id
 */
export async function getUserById(userId) {
  return await db.get(
    'SELECT id, username, created_at FROM users WHERE id = ?',
    [userId]
  );
}

/**
 * Clean up old sessions (optional maintenance)
 */
export async function cleanupOldSessions(hoursOld = 24) {
  await db.run(
    `DELETE FROM sessions
     WHERE datetime(last_active) < datetime('now', '-' || ? || ' hours')`,
    [hoursOld]
  );
}

/**
 * Helper: Generate random token
 */
function generateToken() {
  return Array.from({ length: 32 }, () =>
    Math.random().toString(36).substring(2, 15)
  ).join('').substring(0, 64);
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (db) {
    await db.close();
    console.log('[Database] Database closed');
  }
}

export { db };
