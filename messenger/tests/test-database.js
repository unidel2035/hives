/**
 * Database Module Tests
 */

import * as db from '../server/database.js';

async function runTests() {
  console.log('Starting database tests...\n');

  try {
    // Initialize database
    await db.initDatabase();
    console.log('✓ Database initialized');

    // Test user registration
    const testUser = `testuser_${Date.now()}`;
    const testPass = 'testpass123';

    const user = await db.registerUser(testUser, testPass);
    console.log('✓ User registered:', user.username);

    // Test duplicate username
    try {
      await db.registerUser(testUser, testPass);
      console.log('✗ Should have prevented duplicate username');
    } catch (error) {
      console.log('✓ Duplicate username prevented');
    }

    // Test authentication
    const authUser = await db.authenticateUser(testUser, testPass);
    console.log('✓ User authenticated:', authUser.username);

    // Test wrong password
    try {
      await db.authenticateUser(testUser, 'wrongpassword');
      console.log('✗ Should have rejected wrong password');
    } catch (error) {
      console.log('✓ Wrong password rejected');
    }

    // Test session creation
    const sessionToken = await db.createSession(user.id, 'test-client');
    console.log('✓ Session created:', sessionToken.substring(0, 20) + '...');

    // Test session validation
    const session = await db.validateSession(sessionToken);
    console.log('✓ Session validated:', session.username);

    // Test room creation
    const room = await db.createRoom('test-room', 'Test Room');
    console.log('✓ Room created:', room.roomId);

    // Test message saving
    const message = await db.saveMessage(
      'test-room',
      user.id,
      user.username,
      'Hello, world!',
      false
    );
    console.log('✓ Message saved:', message.id);

    // Test message retrieval
    const messages = await db.getRoomMessages('test-room');
    console.log('✓ Messages retrieved:', messages.length, 'messages');

    // Test session deletion
    await db.deleteSession(sessionToken);
    const deletedSession = await db.validateSession(sessionToken);
    if (!deletedSession) {
      console.log('✓ Session deleted');
    }

    // Close database
    await db.closeDatabase();
    console.log('✓ Database closed');

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
