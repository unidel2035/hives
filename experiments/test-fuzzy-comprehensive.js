#!/usr/bin/env node

// Comprehensive fuzzy matching test
import { fuzzyScore } from '../polza-cli/src/lib/autocomplete.js';

console.log('🧪 Comprehensive Fuzzy Matching Test:\n');

const testCases = [
  {
    pattern: 's',
    expected: ['/save', '/sessions', '/settings'],
    shouldNotMatch: [],
    description: 'Pattern "s" should match commands starting with s'
  },
  {
    pattern: 'mem',
    expected: ['/memory'],
    shouldNotMatch: [],
    description: 'Pattern "mem" should match /memory'
  },
  {
    pattern: 'set',
    expected: ['/settings'],
    shouldNotMatch: [],
    description: 'Pattern "set" should match /settings'
  },
  {
    pattern: '/s',
    expected: ['/save', '/sessions', '/settings'],
    shouldNotMatch: [],
    description: 'Pattern "/s" should match commands starting with /s'
  },
  {
    pattern: 'ver',
    expected: ['/version'],
    shouldNotMatch: [],
    description: 'Pattern "ver" should match /version'
  },
  {
    pattern: 'his',
    expected: ['/history'],
    shouldNotMatch: [],
    description: 'Pattern "his" should match /history'
  }
];

const allCommands = [
  '/help', '/version', '/tools', '/memory', '/settings',
  '/restore', '/clear', '/history', '/sessions', '/save',
  '/load', '/markdown', '/yolo', '/init', '/exit'
];

let passed = 0;
let failed = 0;

testCases.forEach(({ pattern, expected, shouldNotMatch, description }) => {
  console.log(`📝 Test: ${description}`);
  console.log(`   Pattern: "${pattern}"`);

  // Score all commands
  const scoredCommands = allCommands.map(cmd => ({
    cmd,
    score: fuzzyScore(pattern, cmd)
  }));

  // Get top matches
  const topMatches = scoredCommands
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Check if expected commands are in top matches
  let testPassed = true;
  expected.forEach(expectedCmd => {
    const found = topMatches.some(m => m.cmd === expectedCmd);
    if (!found) {
      console.log(`   ❌ Expected "${expectedCmd}" in top matches, but not found`);
      testPassed = false;
    }
  });

  // Check that shouldNotMatch commands aren't in top matches
  shouldNotMatch.forEach(notExpectedCmd => {
    const found = topMatches.some(m => m.cmd === notExpectedCmd);
    if (found) {
      console.log(`   ❌ Did not expect "${notExpectedCmd}" in top matches, but found`);
      testPassed = false;
    }
  });

  if (testPassed) {
    console.log('   ✅ PASSED');
    console.log(`   Top matches: ${topMatches.map(m => `${m.cmd}(${m.score})`).join(', ')}`);
    passed++;
  } else {
    console.log('   ❌ FAILED');
    console.log(`   Top matches: ${topMatches.map(m => `${m.cmd}(${m.score})`).join(', ')}`);
    failed++;
  }
  console.log('');
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
console.log(failed === 0 ? '✨ All tests passed!' : '❌ Some tests failed');
