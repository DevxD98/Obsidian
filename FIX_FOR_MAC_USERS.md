# 🔧 How to Open Obsidian Browser on Mac

## ⚠️ Getting "can't be opened" error?

This is a normal macOS security feature. The app is **100% safe**, but macOS blocks apps that aren't signed with a paid Apple Developer certificate ($99/year).

---

## ✅ **SOLUTION 1: Remove Quarantine (Easiest - 10 seconds)**

1. **Open Terminal** (Spotlight → type "Terminal")
2. **Copy and paste this command:**

```bash
xattr -cr "/Applications/Obsidian Browser.app"
```

3. **Press Enter**
4. **Open the app normally** - It will work now!

---

## ✅ **SOLUTION 2: Right-Click Method**

1. Go to **Applications** folder
2. Find "Obsidian Browser"
3. **Right-click** (or Control+click) on it
4. Select **"Open"**
5. Click **"Open"** in the popup dialog
6. Done! App is now trusted

---

## ✅ **SOLUTION 3: System Settings**

1. Try to open the app (it will fail)
2. Go to **System Settings** → **Privacy & Security**
3. Scroll down to find: _"Obsidian Browser was blocked"_
4. Click **"Open Anyway"**
5. Confirm with your password

---

## ✅ **SOLUTION 4: Disable Gatekeeper Temporarily (Advanced)**

```bash
# Disable Gatekeeper
sudo spctl --master-disable

# Open the app

# Re-enable Gatekeeper (recommended)
sudo spctl --master-enable
```

---

## 🚨 **Still Not Working?**

### Try this complete reset:

```bash
# Remove all quarantine attributes
xattr -cr "/Applications/Obsidian Browser.app"

# Remove from quarantine database
xattr -d com.apple.quarantine "/Applications/Obsidian Browser.app"

# Clear Launch Services cache
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user

# Restart Finder
killall Finder
```

---

## 📝 **Why Does This Happen?**

- Apps need to be **code-signed** with an Apple Developer certificate
- The certificate costs **$99/year** from Apple
- Without it, macOS Gatekeeper blocks the app as "unidentified developer"
- This is completely normal for indie/open-source apps!

---

## ✨ **Once Opened:**

The app will be permanently trusted and you won't see this error again!

Enjoy your beautiful Obsidian Browser with:

- 🌀 Cosmic Portal background
- 🏎️ Light Speed effects
- 💻 Matrix Rain animation
- 🔒 Maximum security & privacy

---

**Questions?** This is a standard macOS security feature, not a bug with the app!
