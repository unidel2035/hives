# Fix: CLI Exits Immediately After Response

## Problem Description

The CLI was exiting immediately after displaying the assistant's response, as reported in issue #100:

```
You > здарова

Assistant >
Здарова! Как дела? Чем могу помочь? 😊

You > %
```

The user expected the CLI to remain open for continued interaction, but instead it exited right after showing the response.

## Root Cause Analysis

The issue was caused by **incorrect readline module import**:

1. **In `package.json`**, the project had a dependency on the npm package `readline@1.3.0`:
   ```json
   "readline": "^1.3.0"
   ```

2. **In `src/interactive.js`**, the code imported readline:
   ```javascript
   import * as readline from 'readline';
   ```

3. **The Problem**: Node.js has a built-in `readline` module for interactive CLI input/output. However, there's also a third-party npm package called `readline` which is designed for reading files line-by-line, NOT for interactive CLI sessions.

4. **What Happened**: When the code imported `readline`, it was loading the third-party npm package instead of Node's built-in module. This third-party package:
   - Is designed for file reading, not interactive input
   - Has completely different API and behavior
   - Was causing the CLI to close unexpectedly after operations

## The Fix

### 1. Remove npm `readline` Package

Removed the third-party `readline` package from `package.json`:

```diff
  "dependencies": {
    "chalk": "^5.3.0",
    "boxen": "^8.0.1",
    "ora": "^8.1.1",
    "marked": "^15.0.6",
    "marked-terminal": "^7.3.0",
    "yargs": "^17.7.2",
-   "readline": "^1.3.0",
    "fast-glob": "^3.3.2",
    "minimatch": "^10.0.1",
    "toml": "^3.0.0",
    "gradient-string": "^3.0.0"
  },
```

### 2. Update Import to Use Node's Built-in Module

Changed the import in `src/interactive.js` to explicitly use Node's built-in module:

```diff
  /**
   * Interactive Mode - Main chat interface
   */

- import * as readline from 'readline';
+ import readline from 'node:readline';
  import { stdin as input, stdout as output } from 'process';
```

The `node:` prefix explicitly tells Node.js to use the built-in module, preventing any conflicts with npm packages.

## Verification

### Test 1: Verify Correct Module is Imported

```bash
node -e "
import readline from 'node:readline';
console.log('✓ readline.createInterface type:', typeof readline.createInterface);
console.log('✓ readline.Interface type:', typeof readline.Interface);
"
```

Expected output:
```
✓ readline.createInterface type: function
✓ readline.Interface type: function
```

### Test 2: Verify npm Package is Removed

```bash
npm list | grep readline
```

Expected output: (nothing - no readline package should be found)

### Test 3: Test Interactive Session

```bash
cd modern-cli
export POLZA_API_KEY=your_key_here
node src/index.js
```

Expected behavior:
- CLI starts and shows welcome message
- User can type multiple messages
- CLI stays open after each response
- CLI only exits when user types `/exit` or presses Ctrl+D

## Files Changed

1. `modern-cli/package.json` - Removed `readline` dependency
2. `modern-cli/src/interactive.js` - Updated import to use `node:readline`
3. `modern-cli/package-lock.json` - Regenerated without `readline` package

## Impact

This fix ensures that:
- ✅ The CLI uses the correct Node.js built-in readline module
- ✅ Interactive sessions remain open for multiple exchanges
- ✅ The CLI only exits when explicitly commanded by the user
- ✅ No breaking changes to existing functionality
- ✅ All other features continue to work as expected

## Related Issues

- Original issue: #100 (CLI-клиент)
- User report: "Comes out immediately after the message!"
