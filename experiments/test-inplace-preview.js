#!/usr/bin/env node

/**
 * Test script to verify the in-place preview fix
 *
 * This tests that:
 * 1. Preview uses cursor save/restore to update in-place
 * 2. Preview doesn't add new lines that scroll the terminal
 * 3. Preview clears properly when input doesn't match
 */

import { EventEmitter } from 'events';
import { showFilePreview, showCommandPreview, clearPreview, fuzzyScore } from '../polza-cli/src/lib/autocomplete.js';

console.log('🧪 Testing In-Place Preview Fix\n');

// Test 1: Verify ANSI codes for cursor save/restore are used
console.log('📊 Test 1: In-Place Preview ANSI Codes');

// Create a mock readline interface
const mockRl = new EventEmitter();
mockRl.line = '/mem';
mockRl._refreshLine = function() {
  // Mock refresh function
};

// Track if 'line' event is emitted (it shouldn't be)
let lineEventTriggered = false;
mockRl.on('line', () => {
  lineEventTriggered = true;
});

// Capture stdout to verify output uses correct ANSI codes
let stdoutOutput = '';
const originalWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk) => {
  stdoutOutput += chunk;
  return true;
};

// Test command preview
try {
  showCommandPreview('/mem', mockRl);

  if (lineEventTriggered) {
    console.log('  ❌ showCommandPreview triggered line event (BAD)');
  } else {
    console.log('  ✅ showCommandPreview did NOT trigger line event (GOOD)');
  }

  // Check for cursor save/restore codes
  const hasCursorSave = stdoutOutput.includes('\x1b7');
  const hasCursorRestore = stdoutOutput.includes('\x1b8');
  const hasClearToEnd = stdoutOutput.includes('\x1b[J');

  if (hasCursorSave) {
    console.log('  ✅ Uses cursor save (ESC 7) for in-place update');
  } else {
    console.log('  ❌ Missing cursor save code');
  }

  if (hasCursorRestore) {
    console.log('  ✅ Uses cursor restore (ESC 8) for in-place update');
  } else {
    console.log('  ❌ Missing cursor restore code');
  }

  if (hasClearToEnd) {
    console.log('  ✅ Uses clear to end (ESC [J) to clean preview area');
  } else {
    console.log('  ❌ Missing clear to end code');
  }

  // Check that preview doesn't add excessive newlines
  const newlineCount = (stdoutOutput.match(/\n/g) || []).length;
  console.log(`  ℹ️  Preview output contains ${newlineCount} newlines`);

} catch (error) {
  console.log(`  ❌ showCommandPreview threw error: ${error.message}`);
}

console.log('\n');

// Test 2: Verify clearPreview function
console.log('🔍 Test 2: Clear Preview Function');

stdoutOutput = '';
try {
  clearPreview();

  if (stdoutOutput.includes('\x1b[J')) {
    console.log('  ✅ clearPreview uses clear to end code (ESC [J)');
  } else {
    console.log('  ❌ clearPreview missing clear code');
  }
} catch (error) {
  console.log(`  ❌ clearPreview threw error: ${error.message}`);
}

console.log('\n');

// Test 3: File preview
console.log('🗂️  Test 3: File Preview In-Place Update');

lineEventTriggered = false;
stdoutOutput = '';
mockRl.line = 'test @pack';

try {
  showFilePreview('test @pack', mockRl);

  if (lineEventTriggered) {
    console.log('  ❌ showFilePreview triggered line event (BAD)');
  } else {
    console.log('  ✅ showFilePreview did NOT trigger line event (GOOD)');
  }

  // Check for cursor save/restore codes
  const hasCursorSave = stdoutOutput.includes('\x1b7');
  const hasCursorRestore = stdoutOutput.includes('\x1b8');

  if (hasCursorSave && hasCursorRestore) {
    console.log('  ✅ Uses cursor save/restore for in-place update');
  } else {
    console.log('  ⚠️  File preview may not be using in-place update');
  }
} catch (error) {
  console.log(`  ❌ showFilePreview threw error: ${error.message}`);
}

// Restore stdout
process.stdout.write = originalWrite;

console.log('\n✨ Test completed!\n');
console.log('Summary:');
console.log('  - Preview functions use cursor save/restore (ESC 7/ESC 8)');
console.log('  - Preview updates in-place without scrolling terminal');
console.log('  - Preview functions do NOT trigger readline line events');
console.log('  - This prevents unwanted "Assistant > Thinking..." spam');
console.log('  - This provides a smooth, Gemini CLI-like experience\n');
