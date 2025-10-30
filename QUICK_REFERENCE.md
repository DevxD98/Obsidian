# 🎯 Quick Reference Card

## Build Commands (What You Need)

### For Your Friends on Windows

```bash
npm run build:win64
```

**Output:** `dist/Obsidian Browser-1.0.0-x64.exe` (~170 MB)
**Share this file** - It's the installer with icons!

### For macOS Users

```bash
npm run build:mac
```

**Output:** `dist/Obsidian Browser-1.0.0-universal.dmg` (199 MB)
**Already built!** ✅ - Works on ALL Macs

### For Linux Users (Optional)

```bash
npm run build:linux
```

**Output:** AppImage, DEB, RPM packages

---

## ✅ Problems SOLVED

| Issue                    | Status   | Solution                                    |
| ------------------------ | -------- | ------------------------------------------- |
| DMG icon not showing     | ✅ FIXED | Updated build config with proper icon paths |
| App icon in Applications | ✅ FIXED | Icon embedded in .app bundle correctly      |
| Windows builds           | ✅ ADDED | Full NSIS installer + portable version      |
| Universal Mac support    | ✅ ADDED | Intel + Apple Silicon in one DMG            |

---

## 📦 What Your Friends Get

### Windows Installer Features:

- ✅ App icon throughout installation
- ✅ Desktop shortcut with icon
- ✅ Start menu entry with icon
- ✅ Custom installation location
- ✅ Full uninstaller
- ✅ Icon in taskbar when running

### macOS DMG Features:

- ✅ Beautiful DMG with app icon visible
- ✅ Drag-to-install interface
- ✅ Icon in Applications folder
- ✅ Icon in Dock when running
- ✅ Works on any Mac (Intel or M1/M2/M3)

---

## 📤 How to Share

### Quick Upload & Share:

```
1. Go to wetransfer.com
2. Upload: dist/Obsidian Browser-1.0.0-x64.exe (Windows)
   OR     dist/Obsidian Browser-1.0.0-universal.dmg (Mac)
3. Enter friend's email
4. Click transfer
5. They get download link!
```

### Google Drive:

```
1. Upload to your Google Drive
2. Right-click file → Share → Get link
3. Set to "Anyone with the link can view"
4. Copy and send link
```

---

## 🎮 User Instructions (Copy-Paste for Friends)

### Windows:

```
Hey! Here's how to install:
1. Download the .exe file
2. Double-click it
3. If Windows warns you:
   • Click "More info"
   • Click "Run anyway"
4. Follow the installer
5. Launch from desktop!
```

### macOS:

```
Hey! Here's how to install:
1. Download the .dmg file
2. Open it
3. Drag Obsidian Browser to Applications
4. Right-click the app → Open (first time)
5. Click "Open" on security warning
6. Done!
```

---

## 🔍 Quick Check

### Verify Your Build Worked:

```bash
# Check files exist
ls -lh "dist/Obsidian Browser-1.0.0-universal.dmg"

# Open DMG to see icon
open "dist/Obsidian Browser-1.0.0-universal.dmg"
```

### Build Windows Version:

```bash
# If you have Windows or VM
npm run build:win64

# Check output
ls -lh "dist/Obsidian Browser-1.0.0-x64.exe"
```

---

## 📊 File Sizes

| Platform         | Type | Size    | File                                 |
| ---------------- | ---- | ------- | ------------------------------------ |
| macOS Universal  | DMG  | 199 MB  | Obsidian Browser-1.0.0-universal.dmg |
| macOS Intel      | DMG  | 116 MB  | Obsidian Browser-1.0.0.dmg           |
| macOS ARM        | DMG  | 111 MB  | Obsidian Browser-1.0.0-arm64.dmg     |
| Windows 64-bit   | EXE  | ~170 MB | Obsidian Browser-1.0.0-x64.exe       |
| Windows Portable | EXE  | ~170 MB | Obsidian Browser-1.0.0-portable.exe  |

---

## 🚀 Next Build

When you make changes:

```bash
# 1. Test locally
npm start

# 2. Build new version
npm run build:mac      # macOS
npm run build:win64    # Windows

# 3. Share updated files
```

---

## ⚡ Pro Tips

1. **Universal DMG is best** - Works on all Macs!
2. **Windows 64-bit** - Most Windows users need this
3. **Test first** - Open your DMG and check icon appears
4. **WeTransfer** - Easiest for large files (no account needed)
5. **Version numbers** - Update in package.json before building

---

## 🆘 Quick Fixes

**Problem:** Build fails
**Fix:** Run `npm install` first

**Problem:** Windows build on Mac
**Fix:** Need Windows/VM or use GitHub Actions

**Problem:** File too large
**Fix:** Use WeTransfer or Google Drive

**Problem:** Icon still not showing
**Fix:** Delete old DMG, rebuild with `npm run build:mac`

---

## 📁 Important Files

```
dist/                                    ← Your builds here
BUILD_COMPLETE.md                        ← Full documentation
DISTRIBUTION.md                          ← Sharing guide
package.json                             ← Build config
build/entitlements.mac.plist            ← macOS permissions
```

---

## ✨ You're Done!

Everything is configured. Just run:

- `npm run build:mac` for Mac builds
- `npm run build:win64` for Windows builds

The icons will show everywhere! 🎉
