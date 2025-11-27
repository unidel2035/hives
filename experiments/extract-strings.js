#!/usr/bin/env node

/**
 * String extraction script for k_da deobfuscation
 *
 * This script ensures all strings, URLs, HTML/SVG content, and configuration
 * are properly extracted from the deobfuscated code.
 *
 * Tasks:
 * 1. Convert all Unicode escape sequences (\uXXXX) to actual characters
 * 2. Extract and document all hardcoded URLs
 * 3. Extract any HTML/SVG content
 * 4. Extract configuration values to environment variables
 * 5. Generate a comprehensive report
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'k_da', 'src', '04-app-code.js');
const OUTPUT_FILE = path.join(__dirname, '..', 'k_da', 'src', '04-app-code.js');
const REPORT_FILE = path.join(__dirname, '..', 'k_da', 'STRING_EXTRACTION_REPORT.md');

console.log('Starting string extraction process...\n');

// Read the file
let content = fs.readFileSync(INPUT_FILE, 'utf8');
const originalSize = content.length;
const originalLines = content.split('\n').length;

console.log(`Input: ${INPUT_FILE}`);
console.log(`Size: ${(originalSize / 1024).toFixed(2)} KB`);
console.log(`Lines: ${originalLines}\n`);

// Statistics
const stats = {
  unicodeEscapes: 0,
  httpUrls: [],
  httpsUrls: [],
  htmlContent: [],
  svgContent: [],
  configValues: [],
  processEnvVars: new Set(),
};

// Step 1: Convert Unicode escape sequences
console.log('Step 1: Converting Unicode escape sequences...');
const unicodePattern = /\\u([0-9a-fA-F]{4})/g;
let match;
let tempContent = content;
let unicodeCount = 0;

while ((match = unicodePattern.exec(tempContent)) !== null) {
  unicodeCount++;
}

console.log(`Found ${unicodeCount} Unicode escape sequences`);

// Convert Unicode escapes to actual characters
content = content.replace(unicodePattern, (match, code) => {
  stats.unicodeEscapes++;
  return String.fromCharCode(parseInt(code, 16));
});

console.log(`Converted ${stats.unicodeEscapes} Unicode escape sequences\n`);

// Step 2: Extract URLs
console.log('Step 2: Extracting URLs...');

// Extract HTTP URLs
const httpPattern = /(http:\/\/[^\s'"]+)/g;
while ((match = httpPattern.exec(content)) !== null) {
  if (!stats.httpUrls.includes(match[1])) {
    stats.httpUrls.push(match[1]);
  }
}

// Extract HTTPS URLs
const httpsPattern = /(https:\/\/[^\s'"`,)]+)/g;
while ((match = httpsPattern.exec(content)) !== null) {
  const url = match[1].replace(/[.,;)]$/, ''); // Remove trailing punctuation
  if (!stats.httpsUrls.includes(url)) {
    stats.httpsUrls.push(url);
  }
}

console.log(`Found ${stats.httpUrls.length} HTTP URLs`);
console.log(`Found ${stats.httpsUrls.length} HTTPS URLs\n`);

// Step 3: Extract HTML content
console.log('Step 3: Checking for HTML/SVG content...');

const htmlPattern = /<html[^>]*>[\s\S]*?<\/html>/gi;
while ((match = htmlPattern.exec(content)) !== null) {
  stats.htmlContent.push(match[0]);
}

const svgPattern = /<svg[^>]*>[\s\S]*?<\/svg>/gi;
while ((match = svgPattern.exec(content)) !== null) {
  stats.svgContent.push(match[0]);
}

console.log(`Found ${stats.htmlContent.length} HTML blocks`);
console.log(`Found ${stats.svgContent.length} SVG blocks\n`);

// Step 4: Extract process.env usage
console.log('Step 4: Extracting process.env usage...');

const envPattern = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
while ((match = envPattern.exec(content)) !== null) {
  stats.processEnvVars.add(match[1]);
}

console.log(`Found ${stats.processEnvVars.size} unique environment variables\n`);

// Step 5: Write the updated content
console.log('Step 5: Writing updated file...');
fs.writeFileSync(OUTPUT_FILE, content, 'utf8');

const newSize = content.length;
const newLines = content.split('\n').length;

console.log(`Output: ${OUTPUT_FILE}`);
console.log(`New size: ${(newSize / 1024).toFixed(2)} KB (${newSize > originalSize ? '+' : ''}${((newSize - originalSize) / 1024).toFixed(2)} KB)`);
console.log(`New lines: ${newLines} (${newLines > originalLines ? '+' : ''}${newLines - originalLines})\n`);

// Step 6: Generate report
console.log('Step 6: Generating extraction report...');

const report = `# K_DA String Extraction Report

Generated: ${new Date().toISOString()}

## Summary

This report documents all strings, URLs, and content extracted from the k_da source code
to ensure complete deobfuscation and proper configuration externalization.

## Statistics

- **Unicode Escape Sequences Converted**: ${stats.unicodeEscapes}
- **HTTP URLs Found**: ${stats.httpUrls.length}
- **HTTPS URLs Found**: ${stats.httpsUrls.length}
- **HTML Blocks Found**: ${stats.htmlContent.length}
- **SVG Blocks Found**: ${stats.svgContent.length}
- **Environment Variables Used**: ${stats.processEnvVars.size}

## File Changes

- **Input File**: ${INPUT_FILE}
- **Original Size**: ${(originalSize / 1024).toFixed(2)} KB
- **New Size**: ${(newSize / 1024).toFixed(2)} KB
- **Size Change**: ${newSize > originalSize ? '+' : ''}${((newSize - originalSize) / 1024).toFixed(2)} KB

## Extracted URLs

### HTTP URLs (${stats.httpUrls.length})

${stats.httpUrls.length > 0 ? stats.httpUrls.map((url, i) => `${i + 1}. \`${url}\``).join('\n') : '*(No HTTP URLs found)*'}

### HTTPS URLs (${stats.httpsUrls.length})

${stats.httpsUrls.length > 0 ? stats.httpsUrls.map((url, i) => `${i + 1}. \`${url}\``).join('\n') : '*(No HTTPS URLs found)*'}

## URL Configuration Status

The following URLs should be configurable via environment variables:

| URL | Environment Variable | Status |
|-----|---------------------|--------|
${stats.httpsUrls
  .filter(url => url.includes('kodacode.ru') || url.includes('github.com') || url.includes('google.com'))
  .map(url => {
    let envVar = '';
    let status = '❓ Unknown';

    if (url.includes('api.kodacode.ru')) {
      envVar = 'KODA_API_BASE';
      status = stats.processEnvVars.has(envVar) ? '✅ Configured' : '⚠️ Needs config';
    } else if (url.includes('docs.kodacode.ru')) {
      envVar = 'KODA_DOCS_URL';
      status = stats.processEnvVars.has(envVar) ? '✅ Configured' : '⚠️ Needs config';
    } else if (url.includes('t.me/kodacommunity')) {
      envVar = 'KODA_COMMUNITY_URL';
      status = stats.processEnvVars.has(envVar) ? '✅ Configured' : '⚠️ Needs config';
    } else if (url.includes('cli-companion.kodacode.ru')) {
      envVar = 'KODA_IDE_COMPANION_URL';
      status = stats.processEnvVars.has(envVar) ? '✅ Configured' : '⚠️ Needs config';
    } else if (url.includes('kodacode.ru') && !url.includes('api') && !url.includes('docs')) {
      envVar = 'KODA_SITE_URL';
      status = stats.processEnvVars.has(envVar) ? '✅ Configured' : '⚠️ Needs config';
    } else if (url.includes('github.com/login/device/code')) {
      envVar = 'GITHUB_DEVICE_CODE_URL';
      status = stats.processEnvVars.has(envVar) ? '✅ Configured' : '⚠️ Needs config';
    } else if (url.includes('github.com/login/oauth/access_token')) {
      envVar = 'GITHUB_OAUTH_TOKEN_URL';
      status = stats.processEnvVars.has(envVar) ? '✅ Configured' : '⚠️ Needs config';
    }

    if (envVar) {
      return `| \`${url}\` | \`${envVar}\` | ${status} |`;
    }
    return null;
  })
  .filter(Boolean)
  .join('\n')}

## HTML/SVG Content

${stats.htmlContent.length > 0 ? '### HTML Blocks\n\n' + stats.htmlContent.map((html, i) => `${i + 1}. Found HTML block (${html.length} chars)`).join('\n') : '*(No HTML content found)*'}

${stats.svgContent.length > 0 ? '### SVG Blocks\n\n' + stats.svgContent.map((svg, i) => `${i + 1}. Found SVG block (${svg.length} chars)`).join('\n') : '*(No SVG content found)*'}

## Environment Variables

The following ${stats.processEnvVars.size} environment variables are used in the code:

${Array.from(stats.processEnvVars).sort().map((envVar, i) => `${i + 1}. \`${envVar}\``).join('\n')}

## Recommendations

### 1. Unicode Conversion
${stats.unicodeEscapes > 0 ?
  `✅ **Completed**: Converted ${stats.unicodeEscapes} Unicode escape sequences to readable characters.` :
  '✅ **No action needed**: No Unicode escape sequences found.'}

### 2. URL Configuration
${stats.httpsUrls.length > 0 ?
  `⚠️ **Review needed**: Found ${stats.httpsUrls.length} hardcoded URLs. Ensure all service URLs are configurable via environment variables.` :
  '✅ **No action needed**: No hardcoded URLs found.'}

### 3. HTML/SVG Extraction
${stats.htmlContent.length + stats.svgContent.length > 0 ?
  `⚠️ **Review needed**: Found ${stats.htmlContent.length + stats.svgContent.length} HTML/SVG blocks. Consider extracting to separate files if appropriate.` :
  '✅ **No action needed**: No embedded HTML/SVG content found.'}

### 4. Configuration Externalization
- Ensure all service URLs have fallback defaults
- Document all environment variables in .env.example
- Add validation for required environment variables
- Consider using a configuration module for better organization

## Next Steps

1. ✅ Unicode escape sequences converted to readable characters
2. ⏳ Verify all URLs are properly configurable
3. ⏳ Review environment variable usage
4. ⏳ Update .env.example with any missing variables
5. ⏳ Test the build with different configurations

## Verification

To verify the extraction was successful:

\`\`\`bash
# Check for remaining Unicode escapes
grep -c "\\\\\\\\u[0-9a-fA-F]" k_da/src/04-app-code.js

# Check for hardcoded URLs
grep -n "https://" k_da/src/04-app-code.js | grep -v "process.env"

# Rebuild and test
cd k_da
node build.js
node k_da.js --help
\`\`\`

---

*This report was generated automatically by the string extraction script.*
`;

fs.writeFileSync(REPORT_FILE, report, 'utf8');

console.log(`Report written to: ${REPORT_FILE}\n`);
console.log('✅ String extraction complete!');
console.log('\nSummary:');
console.log(`  - Converted ${stats.unicodeEscapes} Unicode escapes`);
console.log(`  - Found ${stats.httpUrls.length} HTTP URLs`);
console.log(`  - Found ${stats.httpsUrls.length} HTTPS URLs`);
console.log(`  - Found ${stats.htmlContent.length} HTML blocks`);
console.log(`  - Found ${stats.svgContent.length} SVG blocks`);
console.log(`  - Found ${stats.processEnvVars.size} environment variables`);
console.log('\nNext: Review the extraction report and rebuild k_da.js');
