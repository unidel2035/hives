/**
 * Test script for markdown rendering functionality
 *
 * This script tests that markdown is properly rendered to the console
 * with colors, formatting, and proper structure.
 */

import { renderMarkdown } from '../src/ui/markdown.js';
import chalk from 'chalk';

function testMarkdown() {
  console.log(chalk.cyan.bold('\n📝 Testing Markdown Rendering\n'));
  console.log('='.repeat(60));

  // Test 1: Headings
  console.log('\n1. Testing Headings:');
  console.log('─'.repeat(60));
  const headingTest = `
# Heading 1
## Heading 2
### Heading 3
`;
  renderMarkdown(headingTest);

  // Test 2: Code blocks
  console.log('\n2. Testing Code Blocks:');
  console.log('─'.repeat(60));
  const codeTest = `
\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`
`;
  renderMarkdown(codeTest);

  // Test 3: Lists
  console.log('\n3. Testing Lists:');
  console.log('─'.repeat(60));
  const listTest = `
Here are some items:

- First item
- Second item
- Third item with **bold text**
`;
  renderMarkdown(listTest);

  // Test 4: Inline formatting
  console.log('\n4. Testing Inline Formatting:');
  console.log('─'.repeat(60));
  const inlineTest = `
This is **bold text**, this is *italic text*, and this is \`inline code\`.

You can also have ~~strikethrough~~ text.
`;
  renderMarkdown(inlineTest);

  // Test 5: Links
  console.log('\n5. Testing Links:');
  console.log('─'.repeat(60));
  const linkTest = `
Check out [this link](https://example.com) for more info.
`;
  renderMarkdown(linkTest);

  // Test 6: Blockquotes
  console.log('\n6. Testing Blockquotes:');
  console.log('─'.repeat(60));
  const quoteTest = `
> This is a blockquote.
> It can span multiple lines.
`;
  renderMarkdown(quoteTest);

  // Test 7: Complex markdown (like AI response)
  console.log('\n7. Testing Complex AI Response:');
  console.log('─'.repeat(60));
  const complexTest = `
# Understanding Async/Await in JavaScript

JavaScript's \`async/await\` syntax provides a cleaner way to work with promises.

## Key Concepts

- **async functions** always return a promise
- **await** pauses execution until promise resolves
- Error handling uses \`try/catch\` blocks

## Example Code

\`\`\`javascript
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
\`\`\`

> **Note**: Remember that \`await\` can only be used inside \`async\` functions!

For more information, see the [MDN documentation](https://developer.mozilla.org).
`;
  renderMarkdown(complexTest);

  console.log('\n' + '='.repeat(60));
  console.log(chalk.green('✓ All markdown rendering tests completed!'));
  console.log();
}

testMarkdown();
