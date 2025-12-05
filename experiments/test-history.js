#!/usr/bin/env node
/**
 * Test script for history manager functionality
 */

import { HistoryManager } from '../modern-cli/src/lib/history-manager.js';

async function testHistoryManager() {
  console.log('\n🧪 Testing History Manager\n');

  const historyManager = new HistoryManager();

  console.log('1. Testing directory initialization...');
  console.log(`   Config Dir: ${historyManager.getConfigDir()}`);
  console.log(`   History File: ${historyManager.getHistoryFile()}`);

  console.log('\n2. Testing history loading (should be empty initially)...');
  let history = await historyManager.loadHistory();
  console.log(`   Loaded ${history.length} commands`);

  console.log('\n3. Testing append to history...');
  await historyManager.appendToHistory('test command 1');
  await historyManager.appendToHistory('test command 2');
  await historyManager.appendToHistory('/help');
  console.log(`   Added 3 test commands`);

  console.log('\n4. Testing history loading again...');
  history = await historyManager.loadHistory();
  console.log(`   Loaded ${history.length} commands:`);
  history.forEach((cmd, i) => {
    console.log(`     ${i + 1}. ${cmd}`);
  });

  console.log('\n5. Testing save history...');
  const newHistory = ['command A', 'command B', 'command C'];
  await historyManager.saveHistory(newHistory);
  console.log(`   Saved ${newHistory.length} commands`);

  console.log('\n6. Testing history loading after save...');
  history = await historyManager.loadHistory();
  console.log(`   Loaded ${history.length} commands:`);
  history.forEach((cmd, i) => {
    console.log(`     ${i + 1}. ${cmd}`);
  });

  console.log('\n7. Testing clear history...');
  await historyManager.clearHistory();
  history = await historyManager.loadHistory();
  console.log(`   History cleared. Now has ${history.length} commands`);

  console.log('\n✓ All tests passed!\n');
}

// Run tests
testHistoryManager().catch(error => {
  console.error('\n✗ Test failed:', error);
  process.exit(1);
});
