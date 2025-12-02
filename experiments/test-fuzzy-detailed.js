#!/usr/bin/env node

// Detailed test to understand fuzzy matching behavior
import { fuzzyScore } from '../polza-cli/src/lib/autocomplete.js';

console.log('🧪 Detailed Fuzzy Matching Test:\n');

// Test with pattern "s"
const commands = ['/save', '/sessions', '/settings', '/version', '/tools', '/history'];
const pattern = 's';

console.log(`Testing pattern: "${pattern}"\n`);

commands.forEach(cmd => {
  const score = fuzzyScore(pattern, cmd);
  const lowerCmd = cmd.toLowerCase();
  const lowerPattern = pattern.toLowerCase();

  // Debug: check match types
  const isExact = lowerCmd === lowerPattern;
  const isStartsWith = lowerCmd.startsWith(lowerPattern);
  const isContains = lowerCmd.includes(lowerPattern);

  console.log(`Command: ${cmd}`);
  console.log(`  Score: ${score}`);
  console.log(`  Exact: ${isExact}, StartsWith: ${isStartsWith}, Contains: ${isContains}`);
  console.log(`  Lower: "${lowerCmd}" vs Pattern: "${lowerPattern}"`);
  console.log('');
});

console.log('\n🔍 Testing with "/" prefix:\n');

const pattern2 = '/s';
commands.forEach(cmd => {
  const score = fuzzyScore(pattern2, cmd);
  console.log(`${cmd}: ${score}`);
});

console.log('\n🔍 Testing pattern "rst":\n');
const pattern3 = 'rst';
['/restore', '/history', '/settings'].forEach(cmd => {
  const score = fuzzyScore(pattern3, cmd);
  const lowerCmd = cmd.toLowerCase();
  console.log(`${cmd}: ${score}`);
  console.log(`  Contains "rst": ${lowerCmd.includes(pattern3)}`);
  console.log(`  Positions: ${lowerCmd.indexOf('r')}, ${lowerCmd.indexOf('s')}, ${lowerCmd.indexOf('t')}`);
});
