# Sigment Distribution Guide

## Overview

This document outlines methods for distributing Sigment language files and tooling for external use. The Sigment system provides multiple distribution options to make constructed languages accessible to external applications and developers.

## Distribution Methods

### 1. NPM Package Distribution

The primary distribution method for Sigment tooling:

```bash
# Install from npm
npm install sigment-language-constructor

# Use in your project
import { SigmentParser, SigmentLanguage } from 'sigment-language-constructor';
```

**Package includes:**
- Core language generation tools
- `.sigment` file parser/interpreter
- Validation utilities
- Example files
- Full documentation

### 2. GitHub Releases with .sigment Files

Download specific language files directly:

```bash
# Download latest release
wget https://github.com/aseio6668/sigment/releases/latest/download/languages.zip

# Or download specific language
curl -O https://github.com/aseio6668/sigment/releases/download/v1.0.0/TechSigment.sigment
```

**Release Assets:**
- Individual `.sigment` files
- Language packs (multiple languages)
- Standalone parser script
- Documentation PDFs

### 3. Direct File Access via GitHub

For development and testing:

```bash
# Raw file access
curl -O https://raw.githubusercontent.com/aseio6668/sigment/main/examples/sigment-files/TechSigment.sigment

# Clone repository
git clone https://github.com/aseio6668/sigment.git
cd sigment/examples/sigment-files/
```

### 4. CDN Distribution

For web applications:

```html
<!-- Load parser from CDN -->
<script src="https://cdn.jsdelivr.net/gh/aseio6668/sigment@main/src/sigment-parser.js"></script>

<!-- Or use ES modules -->
<script type="module">
  import { SigmentParser } from 'https://cdn.skypack.dev/sigment-language-constructor';
</script>
```

### 5. Docker Container

For isolated environments:

```dockerfile
FROM node:18-alpine
RUN npm install -g sigment-language-constructor
COPY languages/ /app/languages/
WORKDIR /app
CMD ["sigment", "list"]
```

## File Structure for Distribution

### Complete Package Structure
```
sigment-language-constructor/
├── src/
│   ├── sigment-parser.js         # Core parser
│   ├── language-generator.js     # Generator
│   └── index.js                  # Main exports
├── examples/
│   ├── sigment-files/            # Example .sigment files
│   │   ├── TechSigment.sigment
│   │   ├── FantasySigment.sigment
│   │   └── MinimalExample.sigment
│   └── integration/              # Integration examples
│       ├── node-example.js
│       ├── react-component.jsx
│       └── python-parser.py
├── docs/
│   ├── SIGMENT_SPEC.md          # File format specification
│   ├── INTEGRATION.md           # Integration guide
│   └── API.md                   # API documentation
├── package.json
└── README.md
```

### Minimal Distribution (Parser Only)
```
sigment-parser-minimal/
├── sigment-parser.js            # Standalone parser
├── sigment-spec.json           # JSON schema
├── examples/
│   └── sample.sigment          # Example file
└── README.md                   # Usage instructions
```

## Creating Distributable Packages

### 1. Export Language to .sigment Format

```bash
# Export existing language
node src/cli.js export-sigment -l MyLanguage -o ./dist/MyLanguage.sigment

# Verify the export
node src/cli.js import-sigment -f ./dist/MyLanguage.sigment
```

### 2. Create Language Pack

```bash
# Create multiple languages and pack them
mkdir language-pack
node src/cli.js export-sigment -l TechSigment -o language-pack/TechSigment.sigment
node src/cli.js export-sigment -l FantasySigment -o language-pack/FantasySigment.sigment

# Create archive
tar -czf sigment-language-pack-v1.0.tar.gz language-pack/
```

### 3. Generate Documentation

```bash
# Auto-generate API docs
npm run docs:generate

# Create distribution README
npm run dist:readme
```

## Download Scripts for External Projects

### Simple Download Script (Bash)

```bash
#!/bin/bash
# download-sigment.sh

SIGMENT_VERSION="${1:-latest}"
LANGUAGE="${2:-TechSigment}"
OUTPUT_DIR="${3:-.}"

echo "Downloading Sigment language: $LANGUAGE"

if [ "$SIGMENT_VERSION" == "latest" ]; then
    URL="https://raw.githubusercontent.com/aseio6668/sigment/main/examples/sigment-files/${LANGUAGE}.sigment"
else
    URL="https://github.com/aseio6668/sigment/releases/download/v${SIGMENT_VERSION}/${LANGUAGE}.sigment"
fi

curl -L "$URL" -o "${OUTPUT_DIR}/${LANGUAGE}.sigment"

if [ $? -eq 0 ]; then
    echo "✅ Downloaded: ${OUTPUT_DIR}/${LANGUAGE}.sigment"
else
    echo "❌ Download failed"
    exit 1
fi
```

Usage:
```bash
chmod +x download-sigment.sh
./download-sigment.sh latest TechSigment ./languages/
```

### Node.js Download Utility

```javascript
// download-sigment.js
import fs from 'fs';
import https from 'https';
import path from 'path';

class SigmentDownloader {
    static async download(language, version = 'latest', outputDir = '.') {
        const filename = `${language}.sigment`;
        const outputPath = path.join(outputDir, filename);

        let url;
        if (version === 'latest') {
            url = `https://raw.githubusercontent.com/aseio6668/sigment/main/examples/sigment-files/${filename}`;
        } else {
            url = `https://github.com/aseio6668/sigment/releases/download/v${version}/${filename}`;
        }

        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(outputPath);

            https.get(url, (response) => {
                if (response.statusCode === 200) {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log(`✅ Downloaded: ${outputPath}`);
                        resolve(outputPath);
                    });
                } else {
                    reject(new Error(`Download failed: ${response.statusCode}`));
                }
            }).on('error', (error) => {
                fs.unlink(outputPath, () => {});
                reject(error);
            });
        });
    }

    static async downloadMultiple(languages, version = 'latest', outputDir = '.') {
        const results = [];
        for (const language of languages) {
            try {
                const path = await this.download(language, version, outputDir);
                results.push({ language, path, success: true });
            } catch (error) {
                results.push({ language, error: error.message, success: false });
            }
        }
        return results;
    }
}

// CLI usage
if (process.argv.length > 2) {
    const language = process.argv[2];
    const version = process.argv[3] || 'latest';
    const outputDir = process.argv[4] || '.';

    SigmentDownloader.download(language, version, outputDir)
        .catch(error => {
            console.error('❌ Download failed:', error.message);
            process.exit(1);
        });
}

export default SigmentDownloader;
```

### Python Download Utility

```python
#!/usr/bin/env python3
# download_sigment.py

import requests
import os
import sys
from pathlib import Path

class SigmentDownloader:
    BASE_URL = "https://raw.githubusercontent.com/aseio6668/sigment/main/examples/sigment-files"
    RELEASE_URL = "https://github.com/aseio6668/sigment/releases/download"

    @classmethod
    def download(cls, language, version='latest', output_dir='.'):
        filename = f"{language}.sigment"
        output_path = Path(output_dir) / filename

        if version == 'latest':
            url = f"{cls.BASE_URL}/{filename}"
        else:
            url = f"{cls.RELEASE_URL}/v{version}/{filename}"

        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()

            output_path.parent.mkdir(parents=True, exist_ok=True)

            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(response.text)

            print(f"✅ Downloaded: {output_path}")
            return str(output_path)

        except requests.RequestException as e:
            raise Exception(f"Download failed: {e}")

    @classmethod
    def download_multiple(cls, languages, version='latest', output_dir='.'):
        results = []
        for language in languages:
            try:
                path = cls.download(language, version, output_dir)
                results.append({'language': language, 'path': path, 'success': True})
            except Exception as e:
                results.append({'language': language, 'error': str(e), 'success': False})
        return results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python download_sigment.py <language> [version] [output_dir]")
        sys.exit(1)

    language = sys.argv[1]
    version = sys.argv[2] if len(sys.argv) > 2 else 'latest'
    output_dir = sys.argv[3] if len(sys.argv) > 3 else '.'

    try:
        SigmentDownloader.download(language, version, output_dir)
    except Exception as e:
        print(f"❌ Download failed: {e}")
        sys.exit(1)
```

## Integration Templates

### Package.json for External Projects

```json
{
  "name": "my-sigment-project",
  "version": "1.0.0",
  "dependencies": {
    "sigment-language-constructor": "^1.0.0"
  },
  "scripts": {
    "download-languages": "node scripts/download-sigment.js",
    "validate-languages": "node scripts/validate-sigment.js"
  }
}
```

### Docker Integration

```dockerfile
# Multi-stage build for optimized distribution
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY languages/ ./languages/
COPY scripts/ ./scripts/

# Install Sigment globally
RUN npm install -g sigment-language-constructor

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "import('./scripts/health-check.js')"

CMD ["node", "scripts/serve-languages.js"]
```

## Version Management

### Semantic Versioning for Languages

- **Major version**: Breaking changes to language structure
- **Minor version**: New vocabulary additions
- **Patch version**: Bug fixes, corrections

Example: `TechSigment-v2.1.3.sigment`

### Release Process

1. **Development**: Create/modify languages
2. **Testing**: Validate with parser
3. **Documentation**: Update specs and examples
4. **Export**: Generate .sigment files
5. **Package**: Create distribution archives
6. **Release**: Tag and publish to GitHub/npm

```bash
# Automated release script
npm run test
npm run build:dist
npm run docs:generate
npm version patch
git push --tags
npm publish
```

## Security Considerations

### File Validation

Always validate downloaded .sigment files:

```javascript
import { SigmentParser } from 'sigment-language-constructor';

function validateSigmentFile(content) {
    try {
        const parser = new SigmentParser();
        const language = parser.parseContent(content);
        return { valid: true, language };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}
```

### Trusted Sources

- Official repository: `github.com/aseio6668/sigment`
- Verified npm package: `sigment-language-constructor`
- Official CDN: `cdn.jsdelivr.net/gh/aseio6668/sigment`

### Content Verification

```bash
# Verify file integrity with checksums
sha256sum TechSigment.sigment
curl -s https://github.com/aseio6668/sigment/releases/download/v1.0.0/checksums.txt
```

## Best Practices

1. **Version Pinning**: Use specific versions in production
2. **Local Caching**: Cache downloaded files to reduce network requests
3. **Error Handling**: Implement robust error handling for downloads
4. **Validation**: Always validate files before use
5. **Fallbacks**: Provide fallback behavior for missing languages
6. **Documentation**: Document language dependencies clearly

## Support and Troubleshooting

### Common Issues

1. **Network Timeouts**: Implement retry logic
2. **File Corruption**: Validate after download
3. **Version Conflicts**: Use dependency management
4. **Missing Languages**: Provide clear error messages

### Getting Help

- GitHub Issues: https://github.com/aseio6668/sigment/issues
- Documentation: https://github.com/aseio6668/sigment/blob/main/README.md
- NPM Package: https://www.npmjs.com/package/sigment-language-constructor