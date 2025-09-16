# Sigment External Integration Guide

## Overview

This guide explains how to integrate Sigment language files (`.sigment`) into external projects. Sigment provides a standardized format for constructed languages with comprehensive tooling for parsing, translation, and manipulation.

## Quick Start

### Installation

#### NPM Package (Recommended)
```bash
npm install sigment-language-constructor
```

#### Direct Download from GitHub
```bash
# Download specific files
curl -O https://raw.githubusercontent.com/aseio6668/sigment/main/src/sigment-parser.js
curl -O https://raw.githubusercontent.com/aseio6668/sigment/main/SIGMENT_SPEC.md

# Or clone repository
git clone https://github.com/aseio6668/sigment.git
```

### Basic Usage

```javascript
import { SigmentParser, SigmentLanguage } from 'sigment-language-constructor';

// Parse a .sigment file
const parser = new SigmentParser();
const language = parser.parseFile('./my-language.sigment');

// Use the language
console.log(language.name); // "MyLanguage"
const sigmentWord = language.translateToSigment('hello');
const englishWord = language.translateToEnglish('hollo');
```

## Integration Examples

### Node.js Application

```javascript
import { SigmentParser, SigmentUtils } from 'sigment-language-constructor';
import fs from 'fs';

class LanguageManager {
    constructor() {
        this.languages = new Map();
        this.parser = new SigmentParser();
    }

    // Load language from file
    loadLanguage(filePath) {
        try {
            const language = this.parser.parseFile(filePath);
            this.languages.set(language.name, language);
            return language;
        } catch (error) {
            console.error(`Failed to load language: ${error.message}`);
            return null;
        }
    }

    // Load all languages from directory
    loadLanguagesFromDirectory(dirPath) {
        const sigmentFiles = SigmentUtils.findSigmentFiles(dirPath, true);

        for (const filePath of sigmentFiles) {
            this.loadLanguage(filePath);
        }

        return this.languages.size;
    }

    // Translate text between languages
    translate(text, fromLang, toLang, direction = 'auto') {
        const language = this.languages.get(fromLang);
        if (!language) return null;

        const words = text.toLowerCase().split(/\s+/);
        const translations = words.map(word => {
            if (direction === 'to-sigment' || direction === 'auto') {
                return language.translateToSigment(word) || word;
            } else {
                return language.translateToEnglish(word) || word;
            }
        });

        return translations.join(' ');
    }

    // Get language statistics
    getLanguageStats(languageName) {
        const language = this.languages.get(languageName);
        return language ? language.getStats() : null;
    }
}

// Usage
const manager = new LanguageManager();
manager.loadLanguagesFromDirectory('./languages');
const result = manager.translate('hello world', 'MyLanguage', null, 'to-sigment');
```

### React Component

```jsx
import React, { useState, useEffect } from 'react';
import { SigmentParser } from 'sigment-language-constructor';

const LanguageTranslator = ({ sigmentFile }) => {
    const [language, setLanguage] = useState(null);
    const [inputText, setInputText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [direction, setDirection] = useState('to-sigment');

    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const response = await fetch(sigmentFile);
                const content = await response.text();
                const parser = new SigmentParser();
                const lang = parser.parseContent(content);
                setLanguage(lang);
            } catch (error) {
                console.error('Failed to load language:', error);
            }
        };

        if (sigmentFile) {
            loadLanguage();
        }
    }, [sigmentFile]);

    const handleTranslate = () => {
        if (!language || !inputText) return;

        const words = inputText.toLowerCase().split(/\s+/);
        const translated = words.map(word => {
            if (direction === 'to-sigment') {
                return language.translateToSigment(word) || word;
            } else {
                return language.translateToEnglish(word) || word;
            }
        }).join(' ');

        setTranslatedText(translated);
    };

    if (!language) {
        return <div>Loading language...</div>;
    }

    return (
        <div className="language-translator">
            <h2>{language.name} Translator</h2>

            <div>
                <label>
                    Translation Direction:
                    <select value={direction} onChange={(e) => setDirection(e.target.value)}>
                        <option value="to-sigment">English → {language.name}</option>
                        <option value="to-english">{language.name} → English</option>
                    </select>
                </label>
            </div>

            <div>
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text to translate..."
                />
            </div>

            <button onClick={handleTranslate}>Translate</button>

            <div>
                <h3>Translation:</h3>
                <p>{translatedText}</p>
            </div>

            <div>
                <h3>Language Info:</h3>
                <pre>{JSON.stringify(language.getStats(), null, 2)}</pre>
            </div>
        </div>
    );
};

export default LanguageTranslator;
```

### Python Integration

```python
import json
import requests
from pathlib import Path

class SigmentParser:
    def __init__(self):
        self.supported_versions = ['1.0']

    def parse_file(self, file_path):
        """Parse a .sigment file from filesystem"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return self.parse_content(content)

    def parse_content(self, content):
        """Parse Sigment content from string"""
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON: {e}")

        self.validate(data)
        return SigmentLanguage(data)

    def validate(self, data):
        """Validate Sigment file structure"""
        if 'sigment' not in data:
            raise ValueError("Missing 'sigment' root object")

        sigment = data['sigment']

        if 'version' not in sigment:
            raise ValueError("Missing 'version' field")

        if sigment['version'] not in self.supported_versions:
            raise ValueError(f"Unsupported version: {sigment['version']}")

        if 'language' not in sigment or 'name' not in sigment['language']:
            raise ValueError("Missing language name")

        if 'dictionaries' not in sigment:
            raise ValueError("Missing dictionaries")

        dicts = sigment['dictionaries']
        if 'to_english' not in dicts or 'to_sigment' not in dicts:
            raise ValueError("Missing required dictionaries")

class SigmentLanguage:
    def __init__(self, data):
        self.data = data
        self.sigment = data['sigment']

    @property
    def name(self):
        return self.sigment['language']['name']

    @property
    def to_english(self):
        return self.sigment['dictionaries']['to_english']

    @property
    def to_sigment(self):
        return self.sigment['dictionaries']['to_sigment']

    def translate_to_sigment(self, word):
        """Translate English word to Sigment"""
        return self.to_sigment.get(word.lower())

    def translate_to_english(self, word):
        """Translate Sigment word to English"""
        return self.to_english.get(word.lower())

    def get_stats(self):
        """Get language statistics"""
        return {
            'name': self.name,
            'total_words': len(self.to_english),
            'version': self.sigment['version'],
            'style': self.sigment['language'].get('style', 'unknown')
        }

# Usage example
def download_and_use_language():
    # Download language from GitHub
    url = "https://raw.githubusercontent.com/aseio6668/sigment/main/examples/sample.sigment"
    response = requests.get(url)

    if response.status_code == 200:
        parser = SigmentParser()
        language = parser.parse_content(response.text)

        print(f"Loaded language: {language.name}")
        print(f"Stats: {language.get_stats()}")

        # Translate some words
        words = ['hello', 'world', 'computer']
        for word in words:
            sigment_word = language.translate_to_sigment(word)
            if sigment_word:
                print(f"{word} → {sigment_word}")
    else:
        print("Failed to download language file")

if __name__ == "__main__":
    download_and_use_language()
```

## API Reference

### SigmentParser

#### Methods
- `parseFile(filePath)` - Parse .sigment file from filesystem
- `parseContent(content)` - Parse .sigment content from string
- `validate(data)` - Validate Sigment data structure
- `exportToFile(language, filePath)` - Export language to .sigment file

### SigmentLanguage

#### Properties
- `name` - Language name
- `version` - Specification version
- `style` - Transformation style
- `toEnglish` - Sigment → English dictionary
- `toSigment` - English → Sigment dictionary
- `sigmentDefinitions` - Sigment → Sigment definitions

#### Methods
- `translateToSigment(word)` - Translate English to Sigment
- `translateToEnglish(word)` - Translate Sigment to English
- `getSigmentDefinition(word)` - Get Sigment definition
- `searchWords(substring, direction)` - Search for words
- `getStats()` - Get language statistics

### SigmentUtils

#### Static Methods
- `isSigmentFile(filePath)` - Check if file is .sigment
- `findSigmentFiles(dirPath, recursive)` - Find .sigment files
- `convertFromDictionaries(dictDir, languageName)` - Convert legacy format

## Distribution Methods

### 1. NPM Package
```bash
npm publish # Your package with .sigment files
```

### 2. GitHub Releases
Create releases with .sigment files as assets:
```bash
gh release create v1.0.0 ./languages/*.sigment
```

### 3. CDN Distribution
```html
<!-- Load from CDN -->
<script src="https://cdn.jsdelivr.net/gh/aseio6668/sigment@main/src/sigment-parser.js"></script>
```

### 4. Direct Download
```javascript
// Fetch language file directly
const response = await fetch('https://raw.githubusercontent.com/aseio6668/sigment/main/languages/example.sigment');
const content = await response.text();
const language = parser.parseContent(content);
```

## Best Practices

### 1. Error Handling
```javascript
try {
    const language = parser.parseFile('./language.sigment');
    // Use language
} catch (error) {
    console.error('Language parsing failed:', error.message);
    // Fallback behavior
}
```

### 2. Caching
```javascript
class LanguageCache {
    constructor() {
        this.cache = new Map();
    }

    async getLanguage(url) {
        if (this.cache.has(url)) {
            return this.cache.get(url);
        }

        const response = await fetch(url);
        const content = await response.text();
        const language = parser.parseContent(content);

        this.cache.set(url, language);
        return language;
    }
}
```

### 3. Validation
```javascript
function validateLanguage(language) {
    const stats = language.getStats();

    if (stats.totalWords < 10) {
        console.warn('Language has very few words');
    }

    if (!stats.hasDefinitions) {
        console.warn('Language lacks Sigment definitions');
    }

    return stats.totalWords > 0;
}
```

## Security Considerations

1. **File Validation**: Always validate .sigment files before use
2. **Size Limits**: Check file sizes to prevent memory issues
3. **Source Trust**: Only download from trusted sources
4. **JSON Safety**: Use safe JSON parsing methods

## Troubleshooting

### Common Issues

1. **Invalid JSON**: Ensure .sigment files are valid JSON
2. **Missing Dictionaries**: Check required dictionary fields exist
3. **Version Mismatch**: Verify version compatibility
4. **Encoding Issues**: Use UTF-8 encoding for all files

### Debug Mode
```javascript
const parser = new SigmentParser();
parser.debug = true; // Enable detailed error messages
```

## Contributing

To contribute integration examples or improvements:
1. Fork the repository
2. Add your integration example
3. Update documentation
4. Submit a pull request

## Support

- GitHub Issues: https://github.com/aseio6668/sigment/issues
- Documentation: https://github.com/aseio6668/sigment/blob/main/README.md
- Specification: https://github.com/aseio6668/sigment/blob/main/SIGMENT_SPEC.md