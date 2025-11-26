#!/usr/bin/env node

/**
 * Build script for K_DA
 * Concatenates split source files into a working executable
 * Inlines i18n data from separate modules
 */

const fs = require('fs');
const path = require('path');

console.log('Building k_da.js from split sources...\n');

// Files to concatenate in order
const sourceFiles = [
  'src/01-webpack-runtime.js',
  'src/02-react-bundle.js',
  'src/03-npm-modules.js',
  'src/04-app-code.js',
  'src/05-main.js',
];

// Read the shebang and imports from original (lines 1-5)
const originalFile = path.join(__dirname, 'k_da_deobfuscated.js');
const originalLines = fs.readFileSync(originalFile, 'utf8').split('\n');
const shebang = originalLines.slice(0, 5).join('\n');

// Read i18n locale files and convert to inline objects
console.log('Loading i18n locale data...');
const enUSFile = fs.readFileSync(path.join(__dirname, 'src/i18n/locales/en-US.js'), 'utf8');
const ruRUFile = fs.readFileSync(path.join(__dirname, 'src/i18n/locales/ru-RU.js'), 'utf8');

// Extract the object definitions (remove export statements)
const enUSObject = enUSFile
  .replace(/^\/\/.*$/gm, '') // Remove comments
  .replace(/export const enUS = /, 'const enUS = ')
  .trim();

const ruRUObject = ruRUFile
  .replace(/^\/\/.*$/gm, '') // Remove comments
  .replace(/export const ruRU = /, 'const ruRU = ')
  .trim();

// Start with shebang
let output = shebang + '\n\n';

// Concatenate all source files
sourceFiles.forEach((file, index) => {
  console.log(`[${index + 1}/${sourceFiles.length}] Adding ${file}...`);
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove the header comment (everything before the first non-comment line)
  content = content.replace(/^\/\*[\s\S]*?\*\/\s*/, '');

  // Special handling for 04-app-code.js - replace i18n import with inline data
  if (file === 'src/04-app-code.js') {
    console.log('   → Inlining i18n locale data...');

    // Remove the import statement for i18n
    content = content.replace(
      /import \{ enUS, ruRU \} from ['"]\.\/i18n\/index\.js['"];?\s*/,
      ''
    );

    // Find where to insert the i18n objects (before var hDn = enUS)
    // Look for the comment about i18n objects
    const i18nCommentIndex = content.indexOf('// i18n objects (enUS, ruRU)');
    if (i18nCommentIndex !== -1) {
      // Insert the i18n objects before the comment
      const i18nInline = `// === Inlined i18n locale data ===
// These objects were extracted from the i18n module during build
${enUSObject}

${ruRUObject}

`;
      content = content.slice(0, i18nCommentIndex) + i18nInline + content.slice(i18nCommentIndex);
    } else {
      console.warn('   ⚠ Warning: Could not find i18n comment insertion point');
    }
  }

  output += content;

  // Add separator comment between files
  if (index < sourceFiles.length - 1) {
    output += '\n// === End of ' + file + ' ===\n\n';
  }
});

// Write the built file
const outputPath = path.join(__dirname, 'k_da.js');
fs.writeFileSync(outputPath, output);
fs.chmodSync(outputPath, '755');

const stats = fs.statSync(outputPath);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

console.log(`\n✓ Built ${outputPath} (${sizeMB} MB)`);
console.log('✓ i18n locale data inlined successfully');
console.log('\nTo run: ./k_da/k_da.js or node k_da/k_da.js');
