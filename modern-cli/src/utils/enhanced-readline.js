/**
 * Enhanced readline with visual fuzzy completion highlighting
 */

import readline from 'node:readline';

/**
 * Create enhanced readline interface
 *
 * This is a simple wrapper that ensures the completer is properly integrated
 * with Node.js readline. The completer function must be synchronous and return
 * [completions, line] tuple as expected by readline.
 */
export function createEnhancedReadline(options) {
  // Simply create the readline interface with the provided options
  // The completer will be called by readline automatically
  const rl = readline.createInterface(options);

  return rl;
}
