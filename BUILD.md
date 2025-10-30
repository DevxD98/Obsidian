# 🏗️ Building Obsidian Browser

## Prerequisites

- Node.js 18+ and npm
- For macOS builds: Xcode Command Line Tools
- For Windows builds: Windows 10+ (or macOS with Wine)

## Build Commands

### Development

```bash
npm start          # Run in development mode
npm run dev        # Run with dev tools
```

### Production Builds

#### macOS (DMG + ZIP)

```bash
npm run build:mac
```

This creates:

- `dist/Obsidian Browser-1.0.0-universal.dmg` (Universal binary - Intel & Apple Silicon)
- `dist/Obsidian Browser-1.0.0-mac.zip`

#### Windows (NSIS Installer + Portable)

```bash
npm run build:win
```

This creates:

- `dist/Obsidian Browser-1.0.0-x64.exe` (64-bit installer)
- `dist/Obsidian Browser-1.0.0-ia32.exe` (32-bit installer)
- `dist/Obsidian Browser-1.0.0-portable.exe` (Portable version)

#### Windows 64-bit Only

```bash
npm run build:win64
```

#### Linux (AppImage + DEB + RPM)

```bash
npm run build:linux
```

#### All Platforms

```bash
npm run build:all
```

## Output

All builds will be in the `dist/` folder.

## Icon Issues Fixed

✅ DMG installer now shows app icon
✅ Application icon appears in Applications folder
✅ Windows installer and shortcuts show icon
✅ Dock/Taskbar shows proper icon

## For Your Friends (Windows Users)

Share one of these from the `dist/` folder:

1. **`Obsidian Browser-1.0.0-x64.exe`** - Full installer (recommended for 64-bit Windows)
2. **`Obsidian Browser-1.0.0-portable.exe`** - No installation needed (run directly)

### Installer Features:

- Choose installation directory
- Desktop shortcut
- Start menu shortcut
- Uninstaller included

## Distribution

### macOS Users

1. Build: `npm run build:mac`
2. Share: `dist/Obsidian Browser-1.0.0-universal.dmg`
3. They drag to Applications folder

### Windows Users

1. Build: `npm run build:win`
2. Share: `dist/Obsidian Browser-1.0.0-x64.exe`
3. They run installer and follow prompts

## Notes

- Universal macOS build supports both Intel and Apple Silicon Macs
- Windows builds include both 32-bit and 64-bit versions
- All builds are code-signed ready (add certificates in CI/CD)
- Icons are automatically embedded in all builds
