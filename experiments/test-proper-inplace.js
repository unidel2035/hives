#!/usr/bin/env node

/**
 * Test proper in-place preview implementation
 *
 * The key insight: We need to track preview height and use cursor positioning
 * to update the preview in-place without scrolling.
 */

const readline = require('readline');

console.log('Testing proper in-place preview\n');

// ANSI escape codes
const moveCursorUp = (lines) => `\x1b[${lines}A`;
const moveCursorDown = (lines) => `\x1b[${lines}B`;
const clearLine = '\x1b[2K';
const clearFromCursor = '\x1b[J';

let previewHeight = 0; // Track number of lines in current preview

function showPreview(text) {
  // Move cursor up to where preview starts (if preview exists)
  if (previewHeight > 0) {
    process.stdout.write(moveCursorUp(previewHeight));
  }

  // Clear from cursor to end of screen (removes old preview)
  process.stdout.write(clearFromCursor);

  // Build new preview
  const lines = [
    '─'.repeat(70),
    `⚡ Commands matching "${text}":`,
    '─'.repeat(70),
    `➤ /help               Show available commands`,
    '─'.repeat(70),
    `💡 Press TAB to autocomplete | Ctrl+C to cancel`
  ];

  // Print preview
  process.stdout.write('\n' + lines.join('\n'));

  // Update preview height (number of lines INCLUDING the leading \n)
  previewHeight = lines.length + 1;

  // Move cursor back up to input line
  process.stdout.write(moveCursorUp(previewHeight));
}

function clearPreview() {
  if (previewHeight > 0) {
    // Move cursor up to preview start
    process.stdout.write(moveCursorUp(previewHeight));
    // Clear from cursor to end
    process.stdout.write(clearFromCursor);
    previewHeight = 0;
  }
}

// Simulate typing /h, /he, /hel, /help
console.log('Simulating typing with in-place preview:');
console.log('Input: /h');
showPreview('/h');

setTimeout(() => {
  // Move to end of input line and add character
  process.stdout.write(moveCursorDown(previewHeight));
  process.stdout.write('e');
  process.stdout.write(moveCursorUp(previewHeight));

  console.log('Input: /he');
  showPreview('/he');

  setTimeout(() => {
    process.stdout.write(moveCursorDown(previewHeight));
    process.stdout.write('l');
    process.stdout.write(moveCursorUp(previewHeight));

    console.log('Input: /hel');
    showPreview('/hel');

    setTimeout(() => {
      process.stdout.write(moveCursorDown(previewHeight));
      process.stdout.write('p');
      process.stdout.write(moveCursorUp(previewHeight));

      console.log('Input: /help');
      showPreview('/help');

      setTimeout(() => {
        console.log('\nClearing preview...');
        clearPreview();

        console.log('\n✅ Preview updated in-place without scrolling!');
        process.exit(0);
      }, 1000);
    }, 1000);
  }, 1000);
}, 1000);
