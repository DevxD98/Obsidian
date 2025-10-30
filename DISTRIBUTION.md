# 🎯 Quick Start - Distributing to Friends

## For Windows Friends

### Option 1: Full Installer (Recommended)

1. Build: `npm run build:win64`
2. Share: `dist/Obsidian Browser-1.0.0-x64.exe`
3. File size: ~200-250 MB
4. They double-click and follow the installer

**What they get:**

- ✅ Desktop shortcut
- ✅ Start menu entry
- ✅ Proper uninstaller
- ✅ App icon everywhere
- ✅ Auto-updates ready (when you set it up)

### Option 2: Portable Version

1. Build: `npm run build:win`
2. Share: `dist/Obsidian Browser-1.0.0-portable.exe`
3. File size: ~200 MB
4. They run directly - no installation

**What they get:**

- ✅ No admin rights needed
- ✅ Run from USB stick
- ✅ No registry entries
- ❌ No desktop/start menu shortcuts

## For macOS Friends

1. Build: `npm run build:mac`
2. Share: `dist/Obsidian Browser-1.0.0-universal.dmg`
3. File size: ~300-350 MB
4. They:
   - Open the DMG
   - Drag app to Applications
   - Done!

**What they get:**

- ✅ Works on Intel AND Apple Silicon Macs
- ✅ Beautiful DMG with icon
- ✅ App icon in dock
- ✅ Normal macOS app experience

## Upload & Share

### Using File Sharing Services:

**Google Drive / Dropbox:**

```
1. Upload the .exe or .dmg file
2. Get shareable link
3. Send to friends
```

**WeTransfer (free, no account):**

```
1. Go to wetransfer.com
2. Upload your build
3. Enter friend's email
4. They get download link
```

**GitHub Releases (if you have a repo):**

```bash
1. Create a release tag
2. Upload builds as release assets
3. Share release URL
```

## File Sizes

- **Windows 64-bit**: ~200 MB
- **Windows Portable**: ~200 MB
- **macOS Universal**: ~350 MB (includes both architectures)
- **Linux AppImage**: ~180 MB

## First-Time User Instructions

### Windows:

```
1. Download Obsidian-Browser-1.0.0-x64.exe
2. Double-click the file
3. Click "Install" (or choose custom location)
4. Wait for installation
5. Launch from desktop or start menu
6. Enjoy! 🚀
```

### macOS:

```
1. Download Obsidian-Browser-1.0.0-universal.dmg
2. Open the DMG file
3. Drag Obsidian Browser to Applications folder
4. Eject the DMG
5. Open from Applications
6. Click "Open" if security warning appears
7. Enjoy! 🚀
```

## Security Notes for Users

**Windows:** Microsoft Defender might show a warning for unsigned apps. Click "More Info" → "Run Anyway"

**macOS:** System Preferences → Security & Privacy → Click "Open Anyway" if warning appears

**To avoid warnings:** Get a code signing certificate (costs $$ but makes it trusted)

## Quick Test Before Sharing

```bash
# Test the build locally first
npm run build:mac  # Test on your Mac
npm run build:win  # Test on Windows (or VM)

# Then share the file from dist/
```
