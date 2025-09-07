# 🍅 Sigment Language Constructor - Quick Start

## For Windows Users

### 🚀 First Time Setup
**Double-click:** `install.bat`

### ▶️ Run the Program
**Double-click:** `run.bat`

### 🎮 See Demo
**Double-click:** `demo.bat`

### 🧹 Clean Up
**Double-click:** `clean.bat`

---

## For Mac/Linux Users

### 🚀 First Time Setup
```bash
chmod +x *.sh
./install.sh
```

### ▶️ Run the Program
```bash
./run.sh
```

### 🎮 See Demo
```bash
./demo.sh
```

### 🧹 Clean Up
```bash
./clean.sh
```

---

## Command Line Examples

### Generate a Basic Language
```bash
# Windows
sigment.bat generate --name MyLang --vocabulary "hello,world,peace"

# Mac/Linux
./sigment.sh generate --name MyLang --vocabulary "hello,world,peace"
```

### Generate with Style
```bash
# Consonant shift style (p↔b, t↔d, k↔g)
sigment.bat generate --name ShiftLang --style consonant_shift --vocabulary "computer,program,data"

# Vowel harmony style
sigment.bat generate --name HarmonyLang --style vowel_harmony --vocabulary "music,harmony,sound"
```

### Generate with Custom Prompt
```bash
sigment.bat generate --name MysticLang --prompt "Create a mystical language with nature themes" --vocabulary "forest,magic,spirit,ancient"
```

### Translate Words
```bash
# English to your language
sigment.bat translate --language MyLang --word hello --direction to-sigment

# Your language to English
sigment.bat translate --language MyLang --word hollo --direction to-english
```

### List Your Languages
```bash
sigment.bat list
```

---

## NPM Commands (Alternative)

```bash
npm start              # Interactive mode
npm run demo          # Run demo
npm run build         # Install & setup
npm run clean         # Clean dictionaries
npm run list          # List languages
```

---

## Generated Files Location

Your language dictionaries are saved in:
**`dictionaries/`** folder

Each language creates 4 files:
- `{YourLanguage}_to_English.json` - Translate to English
- `{YourLanguage}_to_{YourLanguage}.json` - Definitions in your language  
- `English_to_{YourLanguage}.json` - Translate from English
- `{YourLanguage}_metadata.json` - Language info

---

## Need Help?

1. **Interactive Mode** - Just run `run.bat` (Windows) or `./run.sh` (Mac/Linux)
2. **Read USAGE.md** - Detailed instructions
3. **Read README.md** - Full documentation

## System Requirements

- **Node.js 16+** (install from https://nodejs.org/)
- **Windows 7+** or **macOS 10.12+** or **Linux**

---

**🎉 That's it! You're ready to create your own languages!**