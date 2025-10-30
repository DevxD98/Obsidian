#!/bin/bash

# ═══════════════════════════════════════════════════════════════
#  OBSIDIAN BROWSER - One-Click Fix for macOS
# ═══════════════════════════════════════════════════════════════
# 
#  This script removes the quarantine flag from the app so it
#  opens without the "can't be opened" error.
# 
#  HOW TO USE:
#  1. Download and install Obsidian Browser to Applications
#  2. Double-click this script (or run: bash fix-mac.sh)
#  3. Done! Open the app normally
# 
# ═══════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🔧 Obsidian Browser - macOS Security Fix"
echo "═══════════════════════════════════════════════════════════════"
echo ""

APP_PATH="/Applications/Obsidian Browser.app"

# Check if app is installed
if [ ! -d "$APP_PATH" ]; then
    echo "❌ Error: Obsidian Browser not found in Applications folder"
    echo ""
    echo "Please install the app first by:"
    echo "  1. Opening the DMG file"
    echo "  2. Dragging 'Obsidian Browser' to Applications"
    echo ""
    exit 1
fi

echo "📦 Found Obsidian Browser at: $APP_PATH"
echo ""
echo "🔐 Removing quarantine attributes..."

# Remove all quarantine attributes
xattr -cr "$APP_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Success! Quarantine attributes removed"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  ✨ You can now open Obsidian Browser normally!"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "The app is now trusted by macOS and will open without errors."
    echo ""
    
    # Ask if user wants to open the app now
    read -p "Would you like to open Obsidian Browser now? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Opening Obsidian Browser..."
        open "$APP_PATH"
    fi
else
    echo "❌ Error: Failed to remove quarantine attributes"
    echo ""
    echo "Please try manually with:"
    echo "  xattr -cr \"$APP_PATH\""
    echo ""
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Enjoy your beautiful, secure Obsidian Browser! 🎉"
echo "════════════════════════════════════════════════════════════════"
echo ""
