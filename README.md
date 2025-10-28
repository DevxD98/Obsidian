# SecureBrowser 🌐

A beautiful, secure, and feature-rich web browser built with Electron for macOS (and cross-platform).

## ✨ Features

### 🎨 Beautiful UI

- Modern glassmorphism design
- Native macOS feel with hidden title bar
- Smooth animations and transitions
- Dark mode support
- Translucent effects and blur

### 🔒 Security Features

- Sandbox mode enabled
- Context isolation for renderer processes
- No Node.js integration in web pages
- HTTPS enforcement
- Certificate validation
- Ad and tracker blocking
- Content Security Policy
- Secure permission handling

### ⚡ Core Browsing

- Multi-tab support
- Forward/back navigation
- Refresh and home buttons
- Smart address bar
- Bookmark support
- Download manager
- Loading indicators

### ⌨️ Keyboard Shortcuts

- `Cmd/Ctrl + T` - New tab
- `Cmd/Ctrl + W` - Close tab
- `Cmd/Ctrl + R` - Refresh
- `Cmd/Ctrl + L` - Focus address bar
- `Cmd/Ctrl + [` - Go back
- `Cmd/Ctrl + ]` - Go forward

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- macOS, Windows, or Linux

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the browser:

```bash
npm start
```

### Development Mode

Run with developer tools open:

```bash
npm run dev
```

## 🏗️ Building

Build for your current platform:

```bash
npm run build
```

Build for specific platforms:

```bash
npm run build:mac    # macOS
npm run build:win    # Windows
npm run build:all    # All platforms
```

## 📁 Project Structure

```
Browser-project/
├── src/
│   ├── main.js           # Main Electron process
│   ├── preload.js        # Preload script (security bridge)
│   └── ui/
│       ├── index.html    # Browser UI
│       ├── styles.css    # Styling
│       └── browser.js    # Browser logic
├── package.json
└── README.md
```

## 🔐 Security Architecture

- **Sandboxing**: All web content runs in a sandbox
- **Context Isolation**: Renderer process is isolated from Node.js
- **No Node Integration**: Web pages cannot access Node.js APIs
- **Preload Script**: Secure bridge between renderer and main process
- **Content Security Policy**: Strict CSP headers
- **Permission Handling**: Controlled permission requests
- **Certificate Validation**: Invalid certificates are blocked

## 🎯 Roadmap

### Phase 1 (Current) ✅

- Basic browser functionality
- Multi-tab support
- Beautiful UI
- Core security features

### Phase 2 (Coming Soon)

- [ ] Bookmark management with sync
- [ ] History with search
- [ ] Settings panel
- [ ] Private/Incognito mode
- [ ] Extensions support

### Phase 3 (Future)

- [ ] AI-powered features
- [ ] Advanced ad blocking
- [ ] Password manager
- [ ] Split-screen browsing
- [ ] Tab groups

## 🤝 Contributing

This is a personal project, but feel free to fork and customize it for your needs!

## 📄 License

MIT License - feel free to use and modify as you wish.

## 🙏 Acknowledgments

Built with:

- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps
- Love for beautiful, secure software ❤️

---

**Note**: This browser is built for personal use and learning purposes. For production use, additional security hardening and testing is recommended.
