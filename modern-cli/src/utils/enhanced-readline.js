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

  // Store last completions for display
  let lastCompletions = [];
  let lastPattern = '';

  // Override internal _tabComplete to add visual feedback
  const originalTabComplete = rl._tabComplete.bind(rl);

  rl._tabComplete = function () {
    const line = this.line;

    if (originalCompleter) {
      originalCompleter(line, (err, [completions, pattern]) => {
        if (!err && completions && completions.length > 0) {
          lastCompletions = completions;
          lastPattern = pattern;

          // If multiple completions, show them with highlighting
          if (completions.length > 1) {
            // Extract the search pattern for highlighting
            let searchPattern = pattern;

            if (pattern.startsWith('/')) {
              searchPattern = pattern.substring(1);
            } else if (pattern.includes('@')) {
              const atIndex = pattern.lastIndexOf('@');
              searchPattern = pattern.substring(atIndex + 1);
            }

            // Show highlighted completions
            const maxDisplay = 10;
            const displayItems = completions.slice(0, maxDisplay);

            console.log(''); // New line
            displayItems.forEach(item => {
              // Extract the relevant part for highlighting
              let itemToHighlight = item;
              if (item.startsWith('/')) {
                itemToHighlight = item.substring(1);
                console.log('  ' + chalk.gray('/') + highlightMatch(searchPattern, itemToHighlight));
              } else if (item.includes('@')) {
                const atIndex = item.lastIndexOf('@');
                const beforeAt = item.substring(0, atIndex + 1);
                const afterAt = item.substring(atIndex + 1);
                console.log('  ' + chalk.gray(beforeAt) + highlightMatch(searchPattern, afterAt));
              } else {
                console.log('  ' + highlightMatch(searchPattern, item));
              }
            });

            if (completions.length > maxDisplay) {
              console.log(chalk.dim(`  ... and ${completions.length - maxDisplay} more`));
            }

            // Redisplay prompt
            this._refreshLine();
          }
        }
      });
    }

    // Call original tab complete
    return originalTabComplete();
  };

  return rl;
}
