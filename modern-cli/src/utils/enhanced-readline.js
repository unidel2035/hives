/**
 * Enhanced readline with visual fuzzy completion highlighting
 */

import readline from 'node:readline';
import chalk from 'chalk';
import { highlightMatch } from './completer.js';

/**
 * Create enhanced readline with visual completion feedback
 */
export function createEnhancedReadline(options) {
  const rl = readline.createInterface(options);
  const originalCompleter = options.completer;

  // Wrap the completer to work synchronously with readline
  if (originalCompleter) {
    // Create a wrapped completer that readline can use
    const wrappedCompleter = (line) => {
      try {
        const result = originalCompleter(line);

        // Extract pattern for highlighting
        const [completions, pattern] = result;

        // If multiple completions, show them with highlighting
        if (completions && completions.length > 1) {
          // Extract the search pattern for highlighting
          let searchPattern = pattern || '';

          if (searchPattern.startsWith('/')) {
            searchPattern = searchPattern.substring(1);
          } else if (searchPattern.includes('@')) {
            const atIndex = searchPattern.lastIndexOf('@');
            searchPattern = searchPattern.substring(atIndex + 1);
          }

          // Show highlighted completions on next line
          const maxDisplay = 9;
          const displayItems = completions.slice(0, maxDisplay);

          // Build the display string
          const displayLines = displayItems.map(item => {
            // Extract the relevant part for highlighting
            if (item.startsWith('/')) {
              const itemWithoutSlash = item.substring(1);
              return chalk.gray('/') + highlightMatch(searchPattern, itemWithoutSlash);
            } else if (item.includes('@')) {
              const atIndex = item.lastIndexOf('@');
              const beforeAt = item.substring(0, atIndex + 1);
              const afterAt = item.substring(atIndex + 1);
              return chalk.gray(beforeAt) + highlightMatch(searchPattern, afterAt);
            } else {
              return highlightMatch(searchPattern, item);
            }
          });

          // Print completions horizontally with spacing
          console.log('\n' + displayLines.join('  '));

          if (completions.length > maxDisplay) {
            console.log(chalk.dim(`  ... and ${completions.length - maxDisplay} more`));
          }
        }

        return result;
      } catch (error) {
        // Return empty array on error
        return [[], line];
      }
    };

    // Replace the completer
    rl.completer = wrappedCompleter;
  }

  return rl;
}
