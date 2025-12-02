#!/usr/bin/env node

/**
 * Visual test for fuzzy autocomplete fix
 *
 * Run this to see the preview update in real-time
 */

import readline from 'readline';
import { createCompleter, showCommandPreview, clearPreview } from '../polza-cli/src/lib/autocomplete.js';

console.log('🧪 Visual Test: Fuzzy Autocomplete Fix for Issue #80\n');
console.log('Instructions:');
console.log('  1. Type "/" to see command preview');
console.log('  2. Continue typing to see preview update IN-PLACE');
console.log('  3. The preview should NOT scroll - it should update in the same spot');
console.log('  4. Press Ctrl+C to exit\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Test > ',
  completer: createCompleter([]),
  terminal: true
});

rl.prompt();

// Add keypress handler
let previewTimeout = null;
rl.input.on('keypress', (str, key) => {
  // Clear any pending preview timeout
  if (previewTimeout) {
    clearTimeout(previewTimeout);
  }

  // Debounce preview updates
  previewTimeout = setTimeout(() => {
    const currentLine = rl.line;

    // Show command preview for / commands
    if (currentLine.startsWith('/') && currentLine.length > 1) {
      showCommandPreview(currentLine, rl);
    }
    // Clear preview if no match
    else {
      clearPreview();
    }
  }, 100); // 100ms debounce
});

rl.on('line', (input) => {
  const trimmedInput = input.trim();

  // Clear any pending preview when line is submitted
  if (previewTimeout) {
    clearTimeout(previewTimeout);
    previewTimeout = null;
  }

  // Clear the preview area
  clearPreview();

  if (!trimmedInput) {
    rl.prompt();
    return;
  }

  if (trimmedInput === 'exit' || trimmedInput === 'quit') {
    console.log('\n👋 Goodbye!');
    process.exit(0);
  }

  console.log(`You entered: ${trimmedInput}`);
  rl.prompt();
});

rl.on('close', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});
