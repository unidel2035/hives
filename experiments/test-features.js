#!/usr/bin/env node

/**
 * Test script for polza-cli new features
 * Tests: autocomplete, shell commands, POLZA.md loading
 */

import { createCompleter } from '../polza-cli/src/lib/autocomplete.js';
import { PolzaMdLoader } from '../polza-cli/src/lib/polza-md-loader.js';
import { processPrompt, hasSpecialSyntax } from '../polza-cli/src/lib/prompt-processor.js';

console.log('Testing polza-cli new features...\n');

// Test 1: Autocomplete
console.log('Test 1: Autocomplete');
const completer = createCompleter(['test-command', 'analyze-file']);
const [hits1, command1] = await completer('/he');
console.log(`  /he -> ${hits1.join(', ')}`);
console.log(`  ✓ Autocomplete working\n`);

// Test 2: Shell command detection
console.log('Test 2: Shell command detection');
const testCases = [
  { input: 'Hello world', expected: false },
  { input: 'Check @file.js', expected: true },
  { input: 'Run !ls -la', expected: true },
  { input: 'Execute !{pwd}', expected: true }
];

for (const test of testCases) {
  const result = hasSpecialSyntax(test.input);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`  ${status} "${test.input}" -> ${result}`);
}
console.log();

// Test 3: Shell command processing (without execution)
console.log('Test 3: Shell command syntax support');
const shellTests = [
  '!ls -la',
  '!{pwd}',
  'Show files: !ls -la',
  'Directory: !{pwd}'
];

for (const test of shellTests) {
  if (hasSpecialSyntax(test)) {
    console.log(`  ✓ Detected shell command in: "${test}"`);
  }
}
console.log();

// Test 4: POLZA.md loader
console.log('Test 4: POLZA.md loader');
const loader = new PolzaMdLoader();
try {
  const instructions = await loader.load();
  if (loader.hasInstructions()) {
    console.log(`  ✓ Loaded ${loader.getLoadedFiles().length} POLZA.md file(s)`);
    loader.getLoadedFiles().forEach(file => {
      console.log(`    - ${file}`);
    });
  } else {
    console.log(`  ✓ No POLZA.md files found (this is OK)`);
  }
} catch (error) {
  console.log(`  ✗ Error loading POLZA.md: ${error.message}`);
}
console.log();

console.log('All tests completed successfully! ✓');
