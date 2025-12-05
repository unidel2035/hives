/**
 * History Manager
 * Manages command history and persistence
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import os from 'os';

export class HistoryManager {
  constructor() {
    // Use $HOME/.config/modern-cli for configuration and history
    this.configDir = path.join(os.homedir(), '.config', 'modern-cli');
    this.historyDir = path.join(this.configDir, 'history');
    this.historyFile = path.join(this.historyDir, 'commands.txt');

    // Initialize directories
    this.initializeDirs();
  }

  /**
   * Initialize required directories
   */
  initializeDirs() {
    try {
      if (!existsSync(this.configDir)) {
        mkdirSync(this.configDir, { recursive: true });
      }
      if (!existsSync(this.historyDir)) {
        mkdirSync(this.historyDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to initialize directories:', error.message);
    }
  }

  /**
   * Load command history from disk
   * @returns {Promise<string[]>} Array of command history lines
   */
  async loadHistory() {
    try {
      if (!existsSync(this.historyFile)) {
        return [];
      }
      const data = await fs.readFile(this.historyFile, 'utf-8');
      return data.split('\n').filter(line => line.trim());
    } catch (error) {
      console.error('Failed to load history:', error.message);
      return [];
    }
  }

  /**
   * Save command history to disk
   * @param {string[]} history - Array of command history lines
   * @returns {Promise<boolean>} Success status
   */
  async saveHistory(history) {
    try {
      const data = history.join('\n');
      await fs.writeFile(this.historyFile, data, 'utf-8');
      return true;
    } catch (error) {
      console.error('Failed to save history:', error.message);
      return false;
    }
  }

  /**
   * Append a single command to history file
   * @param {string} command - Command to append
   * @returns {Promise<boolean>} Success status
   */
  async appendToHistory(command) {
    try {
      await fs.appendFile(this.historyFile, command + '\n', 'utf-8');
      return true;
    } catch (error) {
      console.error('Failed to append to history:', error.message);
      return false;
    }
  }

  /**
   * Clear history file
   * @returns {Promise<boolean>} Success status
   */
  async clearHistory() {
    try {
      await fs.writeFile(this.historyFile, '', 'utf-8');
      return true;
    } catch (error) {
      console.error('Failed to clear history:', error.message);
      return false;
    }
  }

  /**
   * Get config directory path
   */
  getConfigDir() {
    return this.configDir;
  }

  /**
   * Get history file path
   */
  getHistoryFile() {
    return this.historyFile;
  }
}
