# Sigment Language Constructor

A system for constructing spoken and written languages based on etymological principles, where the pronunciation follows English phonetic rules while creating systematic transformations.

## Philosophy

Sigment Languages are constructed based on the principle that:
1. **English Phonetics Maintained**: When looking at Sigment words written in English characters, they should be pronounced as if reading English
2. **Etymological Logic**: Word transformations are based on etymological analysis and morpheme relationships
3. **Systematic Consistency**: Transformations follow logical rules rather than random changes
4. **Three-Dictionary System**: Complete translation capability between English and the Sigment language

## Features

- **Etymological Analysis**: Deep analysis of English word origins, morphemes, and semantic components
- **Phonetic Mapping**: Systematic transformation while preserving English pronunciation patterns
- **Ollama Integration**: Enhanced analysis using local LLM models for rich etymological data
- **Multiple Transformation Styles**: Various approaches to language generation
- **Three-Dictionary System**: 
  - New Language → English definitions
  - New Language → New Language definitions
  - English → New Language translations
- **CLI & Interactive Modes**: Both command-line and interactive interfaces
- **Import/Export**: Save and load language definitions

## Installation

```bash
npm install
```

For Ollama integration (optional but recommended):
```bash
# Install Ollama locally
# Then pull a model like:
ollama pull llama3.2
```

## Quick Start

### Interactive Mode (Recommended)
```bash
npm run start
# or
node src/cli.js interactive
```

### Command Line Usage
```bash
# Generate a basic language
node src/cli.js generate --name MyLanguage --style default

# Generate with custom vocabulary
node src/cli.js generate --name TechLang --vocabulary "computer,program,data,network,server"

# Generate with custom prompt
node src/cli.js generate --name MythLang --prompt "Create a language influenced by ancient mythology with emphasis on nature and mystical concepts"

# Generate from word file
echo "hello\nworld\ncomputer\nmusic" > words.txt
node src/cli.js generate --name FileLang --vocabulary file:words.txt
```

## Transformation Styles

1. **default**: Balanced approach with mild transformations
2. **consonant_shift**: Systematic consonant changes (p↔b, t↔d, k↔g, etc.)
3. **vowel_harmony**: Vowels in words harmonize to front or back patterns
4. **morpheme_emphasis**: Emphasizes root morphemes with modifications
5. **phonetic_logic**: Maintains strict phonetic integrity and patterns

## Usage Examples

### Basic Generation
```javascript
import { LanguageGenerator } from './src/index.js';

const generator = new LanguageGenerator();
const result = await generator.generateLanguage({
    name: 'MyLanguage',
    style: 'consonant_shift',
    vocabulary: ['hello', 'world', 'computer', 'language'],
    customPrompt: 'Create a tech-focused language with Germanic influences'
});

console.log(result.dictionaries);
```

### Translation
```bash
# Translate English to Sigment
node src/cli.js translate --language MyLanguage --word hello --direction to-sigment

# Translate Sigment to English  
node src/cli.js translate --language MyLanguage --word hollo --direction to-english

# Get Sigment definition
node src/cli.js translate --language MyLanguage --word hollo --direction sigment-def
```

### List and Info
```bash
# List all languages
node src/cli.js list

# Show language information
node src/cli.js info --language MyLanguage
```

## File Structure

```
├── src/
│   ├── etymological-analyzer.js  # Word analysis and morpheme breakdown
│   ├── phonetic-mapper.js       # Phonetic transformations
│   ├── ollama-client.js         # LLM integration for enhanced analysis
│   ├── language-generator.js    # Main generation engine
│   ├── cli.js                   # Command-line interface
│   └── index.js                 # Main exports
├── dictionaries/                # Generated language files
├── test/                       # Test files
└── data/                      # Word lists and language data
```

## Generated Files

For each language, the system creates:

- `{LanguageName}_to_English.json`: Sigment words with English definitions
- `{LanguageName}_to_{LanguageName}.json`: Sigment words with Sigment definitions  
- `English_to_{LanguageName}.json`: English words with Sigment translations
- `{LanguageName}_metadata.json`: Language metadata and generation info

## Ollama Integration

The system can use Ollama for enhanced etymological analysis:

```bash
# Start Ollama service
ollama serve

# The system will automatically connect to http://localhost:11434
# Configure different URL/model with --ollama-url and --ollama-model
```

Benefits of Ollama integration:
- Rich etymological data
- Enhanced morpheme analysis
- Cultural and contextual word relationships
- Better semantic understanding

## Custom Prompts

Custom prompts allow you to influence language generation:

```bash
node src/cli.js generate --name NatureLang --prompt "Create a language inspired by natural elements, with flowing sounds and earth-based concepts"
```

The system analyzes your prompt and applies:
- Phonetic transformation preferences
- Morphological patterns
- Semantic organization principles
- Cultural/thematic influences

## API Usage

```javascript
import { LanguageGenerator, EtymologicalAnalyzer, PhoneticMapper } from './src/index.js';

// Individual components
const analyzer = new EtymologicalAnalyzer();
const etymology = await analyzer.analyzeWord('computer');

const mapper = new PhoneticMapper();
const mapping = mapper.mapWordToSigment('computer', etymology, 'consonant_shift');

// Full generation
const generator = new LanguageGenerator();
const language = await generator.generateLanguage({
    name: 'TechSigment',
    vocabulary: ['algorithm', 'database', 'network'],
    style: 'phonetic_logic'
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Examples

Here are some example transformations using different styles:

**Default Style:**
- computer → komputer /kɔmpjutɛr/
- language → languaj /læŋgwæʤ/
- beautiful → peautiful /pjutɪfʌl/

**Consonant Shift:**
- computer → gombuter /gɔmputɛr/
- language → languake /læŋgwækɛ/
- beautiful → peautikul /pjutɪkʌl/

**Vowel Harmony:**
- computer → competer /kɔmpɛtɛr/
- language → lengoego /lɛŋgɛgɔ/
- beautiful → beiutiful /pjutɪfʌl/

The system maintains English keyboard characters and pronunciation patterns while creating systematic, etymologically-grounded transformations.