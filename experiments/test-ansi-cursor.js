#!/usr/bin/env node

/**
 * Test ANSI cursor save/restore behavior
 */

console.log('Testing ANSI cursor save/restore behavior\n');

// Test 1: Current implementation (what PR #79 did)
console.log('Test 1: Current implementation with ESC 7/ESC 8');
console.log('Input: /h');
process.stdout.write('\x1b7');       // Save cursor position
process.stdout.write('\x1b[J');      // Clear from cursor to end
process.stdout.write('\nPreview 1'); // Print preview
process.stdout.write('\x1b8');       // Restore cursor position

setTimeout(() => {
  console.log('\nInput: /he');
  process.stdout.write('\x1b7');       // Save cursor position
  process.stdout.write('\x1b[J');      // Clear from cursor to end
  process.stdout.write('\nPreview 2'); // Print preview
  process.stdout.write('\x1b8');       // Restore cursor position

  setTimeout(() => {
    console.log('\n\nTest 2: Alternative approach with cursor positioning');
    console.log('Input: /h');
    // Get current cursor position - but this is complex and requires terminal response

    setTimeout(() => {
      console.log('\n\nConclusion:');
      console.log('The issue is that ESC 7/ESC 8 saves/restores the cursor position,');
      console.log('but after we move to a new line (\\n) and write the preview,');
      console.log('the restore brings us back to the ORIGINAL line, not accounting');
      console.log('for the new lines we just printed.');
      console.log('');
      console.log('The preview appears below, but the cursor jumps back up,');
      console.log('leaving the preview visible and creating the scrolling effect.');
      process.exit(0);
    }, 1000);
  }, 1000);
}, 1000);
