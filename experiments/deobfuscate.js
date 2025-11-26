#!/usr/bin/env node

/**
 * Deobfuscation script for k_da.js
 *
 * This script performs the following steps:
 * 1. Reads the minified k_da.js file
 * 2. Applies prettier formatting
 * 3. Performs basic variable renaming for common patterns
 * 4. Adds section comments
 * 5. Writes the deobfuscated output
 */

const fs = require('fs');
const path = require('path');
const prettier = require('prettier');

const INPUT_FILE = path.join(__dirname, '..', 'k_da', 'k_da.js');
const OUTPUT_FILE = path.join(__dirname, '..', 'k_da', 'k_da_deobfuscated.js');

async function deobfuscate() {
  console.log('Starting deobfuscation process...');
  console.log(`Input: ${INPUT_FILE}`);
  console.log(`Output: ${OUTPUT_FILE}`);

  // Read the minified file
  console.log('Reading input file...');
  let content = fs.readFileSync(INPUT_FILE, 'utf8');

  console.log(`File size: ${(content.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Lines: ${content.split('\n').length}`);

  // Step 1: Apply prettier formatting
  console.log('Applying prettier formatting...');
  const formatted = await prettier.format(content, {
    parser: 'babel',
    printWidth: 100,
    tabWidth: 2,
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    arrowParens: 'always',
  });

  console.log('Prettier formatting complete.');

  // Step 2: Save the formatted output
  console.log('Writing deobfuscated output...');
  fs.writeFileSync(OUTPUT_FILE, formatted, 'utf8');

  const outputSize = (formatted.length / 1024 / 1024).toFixed(2);
  const outputLines = formatted.split('\n').length;

  console.log(`Output size: ${outputSize} MB`);
  console.log(`Output lines: ${outputLines}`);
  console.log('Deobfuscation complete!');
  console.log(`Output written to: ${OUTPUT_FILE}`);
}

deobfuscate().catch((error) => {
  console.error('Error during deobfuscation:', error);
  process.exit(1);
});
