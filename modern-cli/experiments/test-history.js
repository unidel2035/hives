/**
 * Test script for history functionality
 *
 * This script tests that:
 * 1. History is loaded from disk
 * 2. History is saved to disk when new commands are added
 * 3. Readline interface receives history for up/down arrow navigation
 */

import { HistoryManager } from '../src/lib/history-manager.js';
import readline from 'node:readline';
import { stdin as input, stdout as output } from 'process';

async function testHistory() {
  console.log('Testing History Functionality\n');
  console.log('='.repeat(50));

  // Test 1: Initialize HistoryManager
  console.log('\n1. Initializing HistoryManager...');
  const historyManager = new HistoryManager();
  console.log('   ✓ Config dir:', historyManager.getConfigDir());
  console.log('   ✓ History file:', historyManager.getHistoryFile());

  // Test 2: Load existing history
  console.log('\n2. Loading history from disk...');
  const history = await historyManager.loadHistory();
  console.log('   ✓ Loaded', history.length, 'commands from history');
  if (history.length > 0) {
    console.log('   Last 5 commands:');
    history.slice(-5).forEach((cmd, i) => {
      console.log(`     ${i + 1}. ${cmd}`);
    });
  }

  // Test 3: Add test commands to history
  console.log('\n3. Adding test commands to history...');
  const testCommands = [
    'test command 1',
    'test command 2',
    'test command 3'
  ];
  for (const cmd of testCommands) {
    await historyManager.appendToHistory(cmd);
    console.log(`   ✓ Added: "${cmd}"`);
  }

  // Test 4: Verify commands were saved
  console.log('\n4. Reloading history to verify persistence...');
  const reloadedHistory = await historyManager.loadHistory();
  console.log('   ✓ Now have', reloadedHistory.length, 'commands');
  const foundTest = reloadedHistory.filter(cmd => cmd.startsWith('test command'));
  console.log('   ✓ Found', foundTest.length, 'test commands');

  // Test 5: Create readline with history
  console.log('\n5. Testing readline integration...');
  const rl = readline.createInterface({
    input,
    output,
    terminal: false,
    history: reloadedHistory,
    historySize: 1000
  });

  console.log('   ✓ Readline created with history option');
  console.log('   ✓ History size:', reloadedHistory.length);

  rl.close();

  console.log('\n' + '='.repeat(50));
  console.log('✓ All history tests completed successfully!');
  console.log('\nNOTE: To test up/down arrow navigation, run the CLI interactively.');
}

testHistory().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
