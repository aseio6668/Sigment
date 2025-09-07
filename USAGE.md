# Sigment Language Constructor - Usage Guide

## Quick Start (Windows)

### 1. First Time Setup
```batch
# Double-click or run from command prompt:
install.bat
```

### 2. Run Interactive Mode
```batch
# Double-click or run:
run.bat
```

### 3. See Demo
```batch
# Double-click or run:
demo.bat
```

## Quick Start (Mac/Linux/Unix)

### 1. First Time Setup
```bash
chmod +x *.sh
./install.sh
```

### 2. Run Interactive Mode
```bash
./run.sh
```

### 3. See Demo
```bash
./demo.sh
```

## Available Scripts

### Windows Batch Files
- **`install.bat`** - Install dependencies and setup
- **`run.bat`** - Start in interactive mode
- **`demo.bat`** - Run comprehensive demo
- **`sigment.bat`** - Main CLI executable
- **`clean.bat`** - Clean generated files

### Unix/Linux/Mac Shell Scripts
- **`install.sh`** - Install dependencies and setup
- **`run.sh`** - Start in interactive mode
- **`demo.sh`** - Run comprehensive demo
- **`sigment.sh`** - Main CLI executable
- **`clean.sh`** - Clean generated files

### NPM Scripts
- **`npm start`** - Interactive mode
- **`npm run demo`** - Run demo
- **`npm run build`** - Install and setup
- **`npm run clean`** - Clean dictionaries
- **`npm run clean:all`** - Deep clean (removes node_modules)
- **`npm run install:fresh`** - Clean and reinstall

## Command Line Usage

### Generate a Language
```bash
# Windows
sigment.bat generate --name MyLang --style consonant_shift

# Unix/Mac/Linux
./sigment.sh generate --name MyLang --style consonant_shift

# Or with npm
npm run generate -- --name MyLang --style consonant_shift
```

### Translate Words
```bash
# Windows
sigment.bat translate --language MyLang --word hello --direction to-sigment

# Unix/Mac/Linux
./sigment.sh translate --language MyLang --word hello --direction to-sigment
```

### List Languages
```bash
# Windows
sigment.bat list

# Unix/Mac/Linux
./sigment.sh list

# Or with npm
npm run list
```

## Language Generation Options

### Styles
- **`default`** - Balanced approach with mild transformations
- **`consonant_shift`** - Systematic consonant changes (p↔b, t↔d, k↔g)
- **`vowel_harmony`** - Vowels harmonize within words
- **`morpheme_emphasis`** - Emphasizes root morphemes
- **`phonetic_logic`** - Maintains strict phonetic integrity

### Vocabulary Sources
```bash
# Custom words
--vocabulary "hello,world,computer,language"

# From file
--vocabulary file:path/to/wordlist.txt

# Default (uses common English words)
# No --vocabulary flag needed
```

### Custom Prompts
```bash
--prompt "Create a mystical language with nature themes and flowing sounds"
```

## Examples

### Basic Generation
```bash
# Windows
sigment.bat generate --name BasicLang --style default --vocabulary "hello,world,peace,love"

# Unix/Mac/Linux
./sigment.sh generate --name BasicLang --style default --vocabulary "hello,world,peace,love"
```

### Advanced Generation with Ollama
```bash
# Ensure Ollama is running: ollama serve
sigment.bat generate --name MysticLang --style vowel_harmony --prompt "Create a mystical language inspired by ancient Celtic with emphasis on nature and magic" --vocabulary file:data/common-words.txt
```

### Translation
```bash
# English to Sigment
sigment.bat translate --language BasicLang --word hello --direction to-sigment

# Sigment to English
sigment.bat translate --language BasicLang --word hollo --direction to-english

# Sigment definition in Sigment
sigment.bat translate --language BasicLang --word hollo --direction sigment-def
```

## File Locations

### Generated Files
- **`dictionaries/`** - All generated language dictionaries
- **`dictionaries/{Lang}_to_English.json`** - Sigment → English
- **`dictionaries/{Lang}_to_{Lang}.json`** - Sigment → Sigment definitions
- **`dictionaries/English_to_{Lang}.json`** - English → Sigment
- **`dictionaries/{Lang}_metadata.json`** - Language metadata

### Word Lists
- **`data/common-words.txt`** - Common English words for generation
- **`data/`** - Place custom word lists here

### Examples
- **`examples/demo.js`** - Comprehensive demonstration
- **`examples/`** - Additional example scripts

## Troubleshooting

### Windows
1. **"Node.js not found"**
   - Install Node.js from https://nodejs.org/
   - Restart command prompt

2. **"npm install failed"**
   - Run as administrator
   - Try: `npm install --verbose`

3. **Script won't run**
   - Right-click → "Run as administrator"
   - Check that files aren't blocked

### Mac/Linux/Unix
1. **"Permission denied"**
   ```bash
   chmod +x *.sh
   ```

2. **"Node.js not found"**
   - Install Node.js from https://nodejs.org/
   - Or use package manager: `sudo apt install nodejs npm`

3. **"npm install failed"**
   ```bash
   sudo npm install --unsafe-perm=true
   ```

## Integration with Other Projects

### As a Module
```javascript
import { LanguageGenerator } from './path/to/sigment-language-constructor/src/index.js';

const generator = new LanguageGenerator();
const result = await generator.generateLanguage({
    name: 'MyProjectLang',
    vocabulary: ['tech', 'words', 'here']
});
```

### As Global Command
```bash
npm install -g .
sigment generate --name GlobalLang
```

## Performance Tips

1. **Use Ollama** for richer etymological data
2. **Start with small vocabularies** (10-50 words) for testing
3. **Use file-based vocabularies** for large word lists
4. **Clean regularly** with clean scripts to save disk space

## Getting Help

- **Interactive help**: Just run `run.bat` or `./run.sh`
- **Command help**: `sigment.bat --help` or `./sigment.sh --help`
- **Issues**: Check README.md or create an issue if this is from a repository