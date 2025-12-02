/**
 * Autocomplete Module
 * Provides tab completion for commands, files, and directories
 */

import fs from 'fs/promises';
import { existsSync, readdirSync, statSync } from 'fs';
import path from 'path';
import glob from 'fast-glob';

/**
 * Available slash commands
 */
const SLASH_COMMANDS = [
  '/help',
  '/tools',
  '/memory',
  '/settings',
  '/restore',
  '/clear',
  '/history',
  '/sessions',
  '/save',
  '/load',
  '/markdown',
  '/yolo',
  '/init',
  '/exit'
];

/**
 * Memory subcommands
 */
const MEMORY_SUBCOMMANDS = ['set', 'add', 'get', 'list', 'search', 'delete', 'remove', 'clear', 'show', 'refresh', 'reload'];

/**
 * Settings subcommands
 */
const SETTINGS_SUBCOMMANDS = ['set', 'get', 'reset', 'path'];

/**
 * Create autocomplete function for readline
 * @param {Array<string>} customCommands - List of custom command names
 * @returns {Function} Completer function for readline
 */
export function createCompleter(customCommands = []) {
  // Combine all available commands
  const allCommands = [...SLASH_COMMANDS, ...customCommands.map(cmd => `/${cmd}`)];

  return function completer(line) {
    const trimmedLine = line.trim();
    
    // Handle @ file completion
    if (trimmedLine.includes('@')) {
      return handleFileCompletion(trimmedLine);
    }

    // Handle slash command completion
    if (trimmedLine.startsWith('/')) {
      return handleCommandCompletion(trimmedLine, allCommands);
    }

    // No completion available
    return [[], line];
  };
}

/**
 * Handle completion for slash commands
 */
function handleCommandCompletion(line, allCommands) {
  const parts = line.split(/\s+/);
  const command = parts[0];

  // Completing command itself
  if (parts.length === 1 && !line.endsWith(' ')) {
    const hits = allCommands.filter(cmd => cmd.startsWith(command));
    return [hits.length > 0 ? hits : allCommands, command];
  }

  // Completing subcommands
  if (line.startsWith('/memory ') && parts.length <= 2 && !line.endsWith(' ')) {
    const partial = parts[1] || '';
    const hits = MEMORY_SUBCOMMANDS.filter(sub => sub.startsWith(partial));
    return [hits, partial];
  }

  if (line.startsWith('/settings ') && parts.length <= 2 && !line.endsWith(' ')) {
    const partial = parts[1] || '';
    const hits = SETTINGS_SUBCOMMANDS.filter(sub => sub.startsWith(partial));
    return [hits, partial];
  }

  // No subcommand completion for this command
  return [[], line];
}

/**
 * Handle completion for @ file references
 */
function handleFileCompletion(line) {
  // Find the last @ in the line
  const lastAtIndex = line.lastIndexOf('@');
  if (lastAtIndex === -1) {
    return [[], line];
  }

  // Extract the partial path after @
  const afterAt = line.substring(lastAtIndex + 1);

  // Check if path is quoted
  const isQuoted = afterAt.startsWith('"') || afterAt.startsWith("'");
  const quote = isQuoted ? afterAt[0] : '';
  const partialPath = isQuoted ? afterAt.substring(1) : afterAt;

  // Split to get only the file path (stop at space, comma, etc. if not quoted)
  const pathEndMatch = isQuoted
    ? partialPath.match(/^([^"']*)/)[1]
    : partialPath.match(/^([^\s,;!?()[\]{}]*)/)[1];

  const searchPath = pathEndMatch || '';

  try {
    const completions = findFileCompletions(searchPath);

    // Format completions with quotes if needed
    const formattedCompletions = completions.map(comp => {
      const needsQuotes = comp.includes(' ');
      if (needsQuotes && !isQuoted) {
        return `"${comp}"`;
      }
      return comp;
    });

    return [formattedCompletions, searchPath];
  } catch (error) {
    return [[], searchPath];
  }
}

/**
 * Find file/directory completions for a partial path
 */
function findFileCompletions(partialPath) {
  const cwd = process.cwd();

  // Parse the partial path
  const isAbsolute = path.isAbsolute(partialPath);
  const basePath = isAbsolute ? '' : cwd;
  const fullPath = isAbsolute ? partialPath : path.join(cwd, partialPath);

  // Get directory to search in
  const dirPath = path.dirname(fullPath);
  const searchName = path.basename(fullPath);

  try {
    // Check if directory exists
    if (!existsSync(dirPath)) {
      // Try fuzzy file search (simplified for sync)
      return fuzzyFileSearch(searchName, cwd);
    }

    // Read directory contents
    const entries = readdirSync(dirPath);

    // Filter and format entries
    const matches = entries
      .filter(entry => {
        // Skip hidden files unless explicitly typed
        if (entry.startsWith('.') && !searchName.startsWith('.')) {
          return false;
        }
        // Skip node_modules and .git
        if (entry === 'node_modules' || entry === '.git') {
          return false;
        }
        // Match the search pattern
        return entry.toLowerCase().startsWith(searchName.toLowerCase());
      })
      .map(entry => {
        const fullEntryPath = path.join(dirPath, entry);
        const stats = statSync(fullEntryPath);

        // Build relative path
        let relativePath;
        if (isAbsolute) {
          relativePath = fullEntryPath;
        } else {
          relativePath = path.relative(cwd, fullEntryPath);
        }

        // Add trailing slash for directories
        return stats.isDirectory() ? relativePath + '/' : relativePath;
      })
      .slice(0, 50); // Limit to 50 suggestions

    return matches;
  } catch (error) {
    // Fallback to fuzzy search (simplified for sync)
    return fuzzyFileSearch(searchName, cwd);
  }
}

/**
 * Fuzzy file search using glob (simplified sync version)
 */
function fuzzyFileSearch(searchName, cwd) {
  if (!searchName || searchName.length < 2) {
    return [];
  }

  try {
    // Simple fallback: just return basic files from current directory
    const entries = readdirSync(cwd, { withFileTypes: true });
    
    return entries
      .filter(entry => {
        // Skip hidden files unless explicitly typed
        if (entry.name.startsWith('.') && !searchName.startsWith('.')) {
          return false;
        }
        // Skip node_modules and .git
        if (entry.name === 'node_modules' || entry.name === '.git') {
          return false;
        }
        // Match the search pattern
        return entry.name.toLowerCase().includes(searchName.toLowerCase());
      })
      .slice(0, 20) // Limit results
      .map(entry => {
        return entry.isDirectory() ? entry.name + '/' : entry.name;
      });
  } catch (error) {
    return [];
  }
}

/**
 * Update completer with new custom commands
 */
export function updateCompleter(rl, customCommands) {
  if (rl && rl.completer) {
    rl.completer = createCompleter(customCommands);
  }
}
