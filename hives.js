#!/usr/bin/env node

/**
 * Hives CLI - Modern CLI client inspired by Gemini CLI
 *
 * A modern command-line interface that brings AI-powered assistance
 * directly into your terminal using polza-cli as the backend.
 *
 * Features:
 * - AI-powered chat with conversation history
 * - File system access and operations
 * - Shell command execution
 * - Custom commands and persistent memory
 * - Markdown rendering
 * - Tab completion and fuzzy matching
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to polza-cli
const POLZA_CLI_PATH = join(__dirname, 'polza-cli', 'cli', 'index.js');

/**
 * Display banner with branding
 */
function showBanner() {
  const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
  };

  console.log(`${colors.bright}${colors.cyan}
╦ ╦╦╦  ╦╔═╗╔═╗  ╔═╗╦  ╦
╠═╣║╚╗╔╝║╣ ╚═╗  ║  ║  ║
╩ ╩╩ ╚╝ ╚═╝╚═╝  ╚═╝╩═╝╩
${colors.reset}${colors.yellow}Modern CLI client powered by Polza AI${colors.reset}
`);
}

/**
 * Main entry point
 */
async function main() {
  // Show banner on interactive mode (no arguments or just flags)
  const args = process.argv.slice(2);
  const hasOnlyFlags = args.every(arg => arg.startsWith('-'));

  if (args.length === 0 || hasOnlyFlags) {
    showBanner();
  }

  // Forward all arguments to polza-cli
  const child = spawn('node', [POLZA_CLI_PATH, ...args], {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('error', (error) => {
    console.error('Error starting Hives CLI:', error.message);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
