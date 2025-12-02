# Polza CLI - Modern TUI Edition

A completely redesigned **Terminal User Interface** for Polza CLI, built with [Ink](https://github.com/vadimdemedes/ink) (React for CLIs).

## 🎨 What's New

This is a **complete redesign** of the polza-cli interface, moving from a traditional readline-based CLI to a modern, beautiful TUI powered by React/Ink.

### ✨ Features

**Modern Interface:**
- 📱 **React-based TUI** - Built with Ink, the React renderer for CLIs
- 🎨 **Beautiful UI** - Bordered boxes, colors, and clean layout
- 💬 **Chat View** - Scrollable conversation history with visual message separation
- ⌨️ **Command Palette** - Press `Ctrl+K` to view all available commands
- 📊 **Status Bar** - Real-time token usage, cost tracking, and mode indicators
- 🎯 **Live Input Hints** - Visual feedback for @file, !shell, and / commands

**All Original Features Preserved:**
- ✅ **Polza AI Integration** - Same powerful AI capabilities
- ✅ **File Inclusion** - `@file.js` syntax still works perfectly
- ✅ **Shell Execution** - `!command` with YOLO mode
- ✅ **Custom Commands** - TOML-based custom commands
- ✅ **Memory Management** - Persistent memory across sessions
- ✅ **Settings** - Configurable preferences
- ✅ **Tools** - All file system and advanced tools
- ✅ **POLZA.md** - Custom instructions support

**Enhanced UX:**
- 🎮 **Keyboard Shortcuts:**
  - `Ctrl+K` - Open command palette
  - `Ctrl+L` - Clear conversation
  - `Ctrl+C` - Exit application
  - `Escape` - Close overlays
- 🔄 **Visual Processing Indicator** - See when the AI is thinking
- 📝 **Markdown Rendering** - Beautiful markdown display
- 🎯 **Smart Input Detection** - Automatic syntax highlighting for special commands

## 🚀 Installation & Usage

### Install Dependencies

```bash
npm install
```

### Run the TUI

```bash
# Using npm script
npm run tui

# Or directly
node src/tui.js

# Or using the bin command (after global install)
polza-tui
```

### Run with Options

```bash
# With YOLO mode
npm run tui -- --yolo

# With specific model
npm run tui -- -m "openai/gpt-4o"

# Combined
npm run tui -- --yolo -m "anthropic/claude-sonnet-4.5"
```

## 📖 How to Use

### Basic Chat

1. Start the TUI:
   ```bash
   npm run tui
   ```

2. Type your message in the input bar at the bottom

3. Press Enter to send

4. The AI response appears in the chat view above

### Using Commands

Press `Ctrl+K` to open the command palette, or type commands directly:

- `/help` - Open command palette
- `/clear` - Clear conversation history
- `/yolo` - Toggle YOLO mode (shell execution)
- `/markdown` - Toggle markdown rendering
- `/save` - Save current session
- `/exit` - Save and exit

### File Inclusion

Include file contents in your prompts:

```
@README.md
@src/index.js
@"path with spaces/file.txt"
```

### Shell Execution (YOLO Mode)

Execute shell commands (requires `--yolo` flag or `/yolo` command):

```
!ls -la
!git status
!npm test
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open command palette |
| `Ctrl+L` | Clear conversation |
| `Ctrl+C` | Exit application |
| `Escape` | Close command palette |
| `Enter` | Submit message |

## 🎯 Interface Components

### Header
Displays:
- Application title
- Current model
- Session ID
- YOLO mode status
- Custom commands count
- POLZA.md loaded indicator
- Keyboard shortcut hints

### Chat View
Shows:
- Conversation history
- User messages (cyan, `▶` prefix)
- Assistant messages (magenta, `◀` prefix)
- System messages (yellow, `⚠` prefix)
- Tool executions
- Processing indicator

### Input Bar
Features:
- Visual cursor
- Live input with cursor position
- Auto-detection hints for:
  - `@` File inclusion
  - `!` Shell commands
  - `/` Commands
- Visual feedback

### Status Bar
Displays:
- Message count
- Token usage
- API cost
- YOLO mode indicator
- Help hint

### Command Palette (Ctrl+K)
Shows:
- All built-in commands
- Custom TOML commands
- Command descriptions
- Keyboard navigation (arrows)
- Special syntax reference

## 🏗️ Architecture

### Technology Stack

- **React** - Component-based UI
- **Ink** - React renderer for CLI
- **esbuild** - JSX transpilation
- **Polza AI Client** - API integration
- **Existing Tools** - All original functionality preserved

### Project Structure

```
polza-cli/
├── src/
│   ├── index.js              # Original CLI (still available)
│   ├── index-tui.jsx         # New TUI main component
│   ├── tui.js                # TUI loader script
│   ├── components/           # React/Ink components
│   │   ├── Header.jsx        # Header component
│   │   ├── ChatView.jsx      # Chat display
│   │   ├── InputBar.jsx      # Input handling
│   │   ├── StatusBar.jsx     # Status display
│   │   └── CommandPalette.jsx # Command overlay
│   ├── lib/                  # Shared libraries
│   │   ├── polza-client.js   # Polza AI client
│   │   ├── history-manager.js
│   │   ├── memory-manager.js
│   │   ├── settings-manager.js
│   │   └── ...
│   └── tools/                # AI tools
│       ├── filesystem.js
│       └── advanced.js
├── package.json
└── README-TUI.md            # This file
```

### Component Hierarchy

```
PolzaTUI (main component)
├── Header
├── CommandPalette (conditional)
├── ChatView
├── InputBar
└── StatusBar
```

## 🔄 Comparison: Original vs TUI

| Feature | Original CLI | TUI Edition |
|---------|-------------|-------------|
| **Interface** | readline-based | React/Ink TUI |
| **Layout** | Sequential | Boxed/Bordered |
| **Chat History** | Linear scrolling | Dedicated chat view |
| **Commands** | `/help` command | Interactive palette (Ctrl+K) |
| **Input** | Readline autocomplete | Visual input bar with hints |
| **Status** | Inline messages | Dedicated status bar |
| **Navigation** | Arrow keys | Keyboard shortcuts |
| **Visual Feedback** | Text-based | Colored boxes & borders |
| **Markdown** | Terminal renderer | Terminal renderer (same) |

## 💡 Why TUI?

The TUI edition provides:

1. **Better Organization** - Clear separation of header, chat, input, and status
2. **Visual Hierarchy** - Bordered boxes make it easy to scan
3. **Modern UX** - Keyboard shortcuts and command palette
4. **Real-time Feedback** - Live status updates and processing indicators
5. **Professional Look** - Clean, modern terminal interface
6. **Preserved Functionality** - All original features still work

## 🔧 Development

### Run in Development Mode

```bash
npm run tui
```

### File Organization

Components are in `src/components/`:
- `Header.jsx` - App header with info
- `ChatView.jsx` - Message display
- `InputBar.jsx` - User input handling
- `StatusBar.jsx` - Status information
- `CommandPalette.jsx` - Command overlay

### How JSX Works

The TUI uses esbuild-register to transpile JSX on-the-fly:

1. `src/tui.js` - Loader script that registers esbuild
2. esbuild transpiles `*.jsx` files at runtime
3. React/Ink renders to the terminal

### Adding Components

1. Create new component in `src/components/`
2. Use Ink's `<Box>` and `<Text>` components
3. Import in `index-tui.jsx`
4. Add to component hierarchy

## 📚 Resources

- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [React Documentation](https://react.dev/)
- [Polza AI](https://polza.ai)
- [Original CLI README](./README.md)

## 🎬 Examples

### Example 1: Basic Chat

```bash
$ npm run tui

┌─────────────────────────────────────────┐
│ ⚡ Polza CLI - Modern TUI Edition       │
│ Model: anthropic/claude-sonnet-4.5      │
│ Session: 1234567890abcdef...            │
│ YOLO Mode: ✗ OFF                        │
│ Press Ctrl+K for commands, Ctrl+C to exit│
└─────────────────────────────────────────┘

💬 Start a conversation by typing below

┌─────────────────────────────────────────┐
│ You > Hello, world!█                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Messages: 0  YOLO: ✗  Ctrl+K for help  │
└─────────────────────────────────────────┘
```

### Example 2: With Command Palette

```bash
Press Ctrl+K:

┌─────────────────────────────────────────┐
│ ⌨ Command Palette    Press ESC to close │
├─────────────────────────────────────────┤
│ Built-in Commands                       │
│ /help - Show this command palette       │
│ /clear - Clear conversation history     │
│ /yolo - Toggle YOLO mode                │
│ ...                                     │
├─────────────────────────────────────────┤
│ Special Syntax:                         │
│   @file.js - Include file content       │
│   !command - Execute shell command      │
└─────────────────────────────────────────┘
```

### Example 3: File Inclusion

```bash
You > Explain @README.md█
💡 File inclusion syntax detected

▶ You
  Explain @README.md

◀ Assistant
  This README describes the Polza CLI TUI Edition...
  [markdown formatted response]

Messages: 2  Tokens: 1234  Cost: 0.0045 RUB
```

## 🐛 Troubleshooting

### JSX Transpilation Errors

If you see JSX errors, ensure esbuild-register is installed:

```bash
npm install --save-dev esbuild esbuild-register
```

### Terminal Size

The TUI works best with a terminal size of at least 80x24. If components appear cramped, increase your terminal size.

### Ink Version

This TUI requires Ink v6 or later:

```bash
npm list ink
```

Should show version `6.x.x` or higher.

## 📝 License

Unlicense (Public Domain)

## 🙏 Credits

- **Ink** by [@vadimdemedes](https://github.com/vadimdemedes) - React renderer for CLI
- **React** by Meta - UI component library
- **Polza AI** - AI API provider
- **Original polza-cli** - Foundation for this TUI

---

Built with ❤️ using React, Ink, and Polza AI
