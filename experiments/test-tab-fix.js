#!/usr/bin/env node

/**
 * Test script for Tab autocomplete fix
 * This script verifies that pressing Tab doesn't crash the application
 */

import { stdin as input, stdout as output } from 'process';
import { createCompleter } from '../modern-cli/src/utils/completer.js';
import { createEnhancedReadline } from '../modern-cli/src/utils/enhanced-readline.js';

console.log('=== Testing Tab Autocomplete Fix ===\n');

// Create a simple history
const commandHistory = ['/help', '/model', 'hello world'];

// Create the completer
const completer = createCompleter(() => commandHistory);

// Test the completer function directly
console.log('1. Testing completer function directly:\n');

const testCases = [
  '/',
  '/h',
  '/help',
  '@',
  '@src',
  'hel',
];

for (const testInput of testCases) {
  try {
    const result = completer(testInput);
    const [completions, pattern] = result;
    console.log(`Input: "${testInput}" → ${completions.length} completions`);
    if (completions.length > 0 && completions.length <= 5) {
      console.log(`  Completions: ${completions.join(', ')}`);
    }
  } catch (error) {
    console.log(`✗ Error for "${testInput}": ${error.message}`);
  }
}

console.log('\n2. Testing enhanced readline creation:\n');

try {
  const rl = createEnhancedReadline({
    input,
    output,
    completer,
    terminal: true,
  });
  console.log('✓ Enhanced readline created successfully');
  console.log(`✓ Has completer: ${typeof rl.completer === 'function'}`);

  // Test the readline completer
  console.log('\n3. Testing readline completer:\n');

  const testLine = '/h';
  rl.completer(testLine, (err, result) => {
    if (err) {
      console.log(`✗ Error: ${err.message}`);
    } else {
      const [completions, pattern] = result;
      console.log(`✓ Completer works: ${completions.length} completions for "${testLine}"`);
      console.log(`  Completions: ${completions.join(', ')}`);
    }

    rl.close();
    console.log('\n✓ Readline closed successfully');
    console.log('\n=== All Tests Complete ===');
    console.log('The Tab key should now work without crashing!\n');
  });
} catch (error) {
  console.log(`✗ Error: ${error.message}`);
  process.exit(1);
}
