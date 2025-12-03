/**
 * Test script to verify the readline fix
 * This tests that Node's built-in readline module is being used correctly
 */

import readline from 'node:readline';
import { stdin, stdout } from 'process';

console.log('=== Testing Node.js Built-in Readline Module ===\n');

// Verify we're using the correct readline module
console.log('✓ Using Node.js built-in readline module');
console.log('✓ readline.createInterface is:', typeof readline.createInterface);
console.log('✓ readline.Interface is:', typeof readline.Interface);

// Create a readline interface
const rl = readline.createInterface({
  input: stdin,
  output: stdout,
  terminal: true,
});

console.log('\n=== Interactive Test ===');
console.log('Type a message and press Enter. Type "exit" to quit.\n');

let messageCount = 0;

const askQuestion = () => {
  rl.question('You > ', (answer) => {
    if (answer.toLowerCase() === 'exit') {
      console.log('\n✓ Exiting gracefully...');
      rl.close();
      process.exit(0);
    }

    messageCount++;
    console.log(`Assistant > I received: "${answer}" (message #${messageCount})`);
    console.log(''); // Empty line for readability

    // Continue the loop - this is the key difference
    // The CLI should NOT exit after displaying a message
    askQuestion();
  });
};

// Handle Ctrl+C
rl.on('SIGINT', () => {
  console.log('\n\n(Ctrl+C pressed. Type "exit" to quit)\n');
  rl.prompt();
});

// Handle close event
rl.on('close', () => {
  console.log('\n✓ Readline closed. Total messages:', messageCount);
});

// Start the loop
askQuestion();
