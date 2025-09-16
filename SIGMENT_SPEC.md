# Sigment File Specification (.sigment)

## Overview

The `.sigment` file format is a structured language definition file that contains the complete specification for a Sigment constructed language. These files enable external applications to understand and work with Sigment languages without requiring the full Sigment Language Constructor system.

## File Format

Sigment files use JSON structure with specific schema requirements for interoperability.

### Basic Structure

```json
{
  "sigment": {
    "version": "1.0",
    "language": {
      "name": "LanguageName",
      "created": "2025-09-16T12:00:00Z",
      "style": "consonant_shift",
      "generator_version": "1.0.0"
    },
    "phonetics": {
      "rules": [...],
      "mappings": {...}
    },
    "dictionaries": {
      "to_english": {...},
      "to_sigment": {...},
      "sigment_definitions": {...}
    },
    "grammar": {
      "rules": [...],
      "patterns": {...}
    },
    "metadata": {
      "etymology_data": {...},
      "generation_context": {...}
    }
  }
}
```

## Schema Definition

### Root Object
- `sigment`: Container object with version and language data
  - `version`: Specification version (string, e.g., "1.0")
  - `language`: Language metadata object
  - `phonetics`: Phonetic transformation rules
  - `dictionaries`: Translation dictionaries
  - `grammar`: Grammar rules and patterns
  - `metadata`: Additional language data

### Language Object
- `name`: Language name (string)
- `created`: ISO 8601 timestamp
- `style`: Transformation style used
- `generator_version`: Version of generator used

### Phonetics Object
- `rules`: Array of phonetic transformation rules
- `mappings`: Character/sound mapping objects

### Dictionaries Object
- `to_english`: Sigment → English translations
- `to_sigment`: English → Sigment translations
- `sigment_definitions`: Sigment → Sigment definitions

### Grammar Object
- `rules`: Array of grammatical rules
- `patterns`: Common language patterns

## File Extension and MIME Type

- **Extension**: `.sigment`
- **MIME Type**: `application/sigment+json`
- **Character Encoding**: UTF-8

## Usage in External Applications

### Parsing
Applications can parse `.sigment` files as JSON and validate against the schema:

```javascript
const sigmentData = JSON.parse(fileContent);
if (sigmentData.sigment && sigmentData.sigment.version) {
    // Valid Sigment file
    const language = sigmentData.sigment.language;
    const dictionaries = sigmentData.sigment.dictionaries;
}
```

### Translation
Use the dictionaries for word translation:

```javascript
// English to Sigment
const sigmentWord = dictionaries.to_sigment[englishWord];

// Sigment to English
const englishMeaning = dictionaries.to_english[sigmentWord];

// Sigment definition
const sigmentDefinition = dictionaries.sigment_definitions[sigmentWord];
```

### Validation
Check file validity:

```javascript
function isValidSigmentFile(data) {
    return data.sigment &&
           data.sigment.version &&
           data.sigment.language &&
           data.sigment.dictionaries;
}
```

## Compatibility

### Version Compatibility
- Version `1.0`: Initial specification
- Forward compatibility maintained through semantic versioning

### Required Fields
Minimum required fields for basic functionality:
- `sigment.version`
- `sigment.language.name`
- `sigment.dictionaries.to_english`
- `sigment.dictionaries.to_sigment`

### Optional Fields
Enhanced functionality fields:
- `sigment.phonetics`
- `sigment.grammar`
- `sigment.metadata`
- `sigment.dictionaries.sigment_definitions`

## Example .sigment File

```json
{
  "sigment": {
    "version": "1.0",
    "language": {
      "name": "TechSigment",
      "created": "2025-09-16T14:30:00Z",
      "style": "consonant_shift",
      "generator_version": "1.0.0"
    },
    "phonetics": {
      "rules": [
        {"from": "p", "to": "b", "context": "any"},
        {"from": "t", "to": "d", "context": "any"},
        {"from": "k", "to": "g", "context": "any"}
      ],
      "mappings": {
        "consonant_shifts": {
          "p": "b", "b": "p",
          "t": "d", "d": "t",
          "k": "g", "g": "k"
        }
      }
    },
    "dictionaries": {
      "to_english": {
        "gombuter": "computer",
        "brodram": "program",
        "dadabase": "database"
      },
      "to_sigment": {
        "computer": "gombuter",
        "program": "brodram",
        "database": "dadabase"
      },
      "sigment_definitions": {
        "gombuter": "elektronig devis kor brogessing dada",
        "brodram": "sed ok instruksions kor gombuter",
        "dadabase": "organizet koleksion ok dada"
      }
    },
    "grammar": {
      "rules": [
        "Word order: Subject-Verb-Object",
        "Plurals: Add -s suffix",
        "Past tense: Add -et suffix"
      ],
      "patterns": {
        "word_order": "SVO",
        "plural_suffix": "s",
        "past_suffix": "et"
      }
    },
    "metadata": {
      "total_words": 150,
      "etymology_sources": ["english", "germanic"],
      "generation_context": "Technology-focused vocabulary"
    }
  }
}
```

## Integration Guidelines

### For Application Developers

1. **File Detection**: Check for `.sigment` extension and validate JSON structure
2. **Version Handling**: Support version-specific parsing logic
3. **Fallback Behavior**: Gracefully handle missing optional fields
4. **Error Handling**: Provide clear messages for invalid files

### For Language Creators

1. **Export Compliance**: Ensure generated files follow this specification
2. **Metadata Inclusion**: Provide rich metadata for better integration
3. **Testing**: Validate files against schema before distribution

## Distribution

Sigment files can be distributed through:
- Direct file sharing
- Package managers (npm, pip, etc.)
- GitHub releases
- Language repositories
- Web download links

## Security Considerations

- **JSON Safety**: Parse with safe JSON methods
- **File Size**: Monitor file sizes for reasonable limits
- **Content Validation**: Validate dictionary entries for expected format
- **Source Trust**: Verify file sources when downloading

## Future Extensions

Planned extensions for future versions:
- Audio pronunciation data
- Cultural context information
- Extended grammar rules
- Cross-language relationships
- Interactive examples