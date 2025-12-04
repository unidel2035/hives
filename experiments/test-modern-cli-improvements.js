#!/usr/bin/env node

/**
 * Test script for CLI improvements
 * - Tests markdown rendering with clean formatting
 * - Tests fuzzy matching with highlighting
 */

import { renderMarkdown } from './src/ui/markdown.js';
import { fuzzyMatch, fuzzyScore, highlightMatch } from './src/utils/completer.js';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n=== Testing CLI Improvements ===\n'));

// Test 1: Markdown rendering
console.log(chalk.yellow('Test 1: Markdown Rendering\n'));

const testMarkdown = `
В текущей папке находятся:

Файлы:

* \`.env.example\` - пример файла конфигурации
* \`FEATURES.md\` - описание возможностей
* \`README.md\` - документация
* \`package.json\` - конфигурация Node.js проекта

Папки:

* \`node_modules\` - установленные зависимости
* \`src\` - исходный код

Это похоже на Node.js проект. Хотите посмотреть содержимое какой-то конкретной папки или файла?
`;

console.log(chalk.gray('Input markdown:'));
console.log(chalk.dim(testMarkdown));
console.log(chalk.gray('\nRendered output:'));
renderMarkdown(testMarkdown);

// Test 2: Fuzzy matching
console.log(chalk.yellow('\n\nTest 2: Fuzzy Match Highlighting\n'));

const testCases = [
  { pattern: 'hlp', text: '/help' },
  { pattern: 'mod', text: '/model' },
  { pattern: 'h', text: '/help' },
  { pattern: 'h', text: '/history' },
  { pattern: 'src', text: 'src/index.js' },
  { pattern: 'pkg', text: 'package.json' },
];

testCases.forEach(({ pattern, text }) => {
  const matches = fuzzyMatch(pattern, text);
  const score = fuzzyScore(pattern, text);

  if (matches) {
    console.log(`Pattern "${chalk.cyan(pattern)}" → ${highlightMatch(pattern, text)} ${chalk.gray(`(score: ${score})`)}`);
  } else {
    console.log(`Pattern "${chalk.cyan(pattern)}" → ${chalk.red('no match')} in "${text}"`);
  }
});

// Test 3: Completion display
console.log(chalk.yellow('\n\nTest 3: Completion Display\n'));

const commands = ['/help', '/history', '/model', '/exit'];
const pattern = 'h';

console.log(chalk.gray(`Completions for "${pattern}":\n`));
commands.forEach(cmd => {
  if (fuzzyMatch(pattern, cmd)) {
    console.log('  ' + highlightMatch(pattern, cmd));
  }
});

console.log(chalk.green('\n✓ All tests completed!\n'));
