/**
 * Sigment File Parser and Interpreter
 * Handles parsing, validation, and manipulation of .sigment files
 */

import fs from 'fs';
import path from 'path';

export class SigmentParser {
    constructor() {
        this.supportedVersions = ['1.0'];
    }

    /**
     * Parse a .sigment file from filesystem
     * @param {string} filePath - Path to .sigment file
     * @returns {Object} Parsed Sigment data
     */
    parseFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return this.parseContent(content, filePath);
        } catch (error) {
            throw new Error(`Failed to read Sigment file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Parse Sigment content from string
     * @param {string} content - JSON content of .sigment file
     * @param {string} source - Source identifier for error reporting
     * @returns {Object} Parsed and validated Sigment data
     */
    parseContent(content, source = 'content') {
        let data;

        try {
            data = JSON.parse(content);
        } catch (error) {
            throw new Error(`Invalid JSON in ${source}: ${error.message}`);
        }

        this.validate(data, source);
        return new SigmentLanguage(data);
    }

    /**
     * Validate Sigment file structure
     * @param {Object} data - Parsed JSON data
     * @param {string} source - Source identifier for error reporting
     */
    validate(data, source = 'data') {
        // Check root structure
        if (!data.sigment) {
            throw new Error(`${source}: Missing 'sigment' root object`);
        }

        const sigment = data.sigment;

        // Check version
        if (!sigment.version) {
            throw new Error(`${source}: Missing 'version' field`);
        }

        if (!this.supportedVersions.includes(sigment.version)) {
            throw new Error(`${source}: Unsupported version '${sigment.version}'. Supported: ${this.supportedVersions.join(', ')}`);
        }

        // Check required language fields
        if (!sigment.language) {
            throw new Error(`${source}: Missing 'language' object`);
        }

        if (!sigment.language.name) {
            throw new Error(`${source}: Missing language name`);
        }

        // Check required dictionaries
        if (!sigment.dictionaries) {
            throw new Error(`${source}: Missing 'dictionaries' object`);
        }

        const dicts = sigment.dictionaries;
        if (!dicts.to_english) {
            throw new Error(`${source}: Missing 'to_english' dictionary`);
        }

        if (!dicts.to_sigment) {
            throw new Error(`${source}: Missing 'to_sigment' dictionary`);
        }

        // Validate dictionary consistency
        this.validateDictionaries(dicts, source);
    }

    /**
     * Validate dictionary consistency
     * @param {Object} dictionaries - Dictionary objects
     * @param {string} source - Source identifier
     */
    validateDictionaries(dictionaries, source) {
        const toEnglish = dictionaries.to_english;
        const toSigment = dictionaries.to_sigment;

        // Check for orphaned entries
        for (const [sigmentWord, englishWord] of Object.entries(toEnglish)) {
            if (toSigment[englishWord] !== sigmentWord) {
                console.warn(`${source}: Dictionary inconsistency - '${sigmentWord}' -> '${englishWord}' but reverse mapping missing or different`);
            }
        }
    }

    /**
     * Export language to .sigment file
     * @param {SigmentLanguage} language - Language object to export
     * @param {string} filePath - Output file path
     */
    exportToFile(language, filePath) {
        const content = JSON.stringify(language.toJSON(), null, 2);
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

/**
 * Sigment Language wrapper class
 */
export class SigmentLanguage {
    constructor(data) {
        this.data = data;
        this.sigment = data.sigment;
    }

    // Language metadata
    get name() { return this.sigment.language.name; }
    get version() { return this.sigment.version; }
    get style() { return this.sigment.language.style; }
    get created() { return this.sigment.language.created; }

    // Dictionaries
    get toEnglish() { return this.sigment.dictionaries.to_english; }
    get toSigment() { return this.sigment.dictionaries.to_sigment; }
    get sigmentDefinitions() { return this.sigment.dictionaries.sigment_definitions || {}; }

    // Optional data
    get phonetics() { return this.sigment.phonetics || {}; }
    get grammar() { return this.sigment.grammar || {}; }
    get metadata() { return this.sigment.metadata || {}; }

    /**
     * Translate English word to Sigment
     * @param {string} word - English word
     * @returns {string|null} Sigment translation or null if not found
     */
    translateToSigment(word) {
        return this.toSigment[word.toLowerCase()] || null;
    }

    /**
     * Translate Sigment word to English
     * @param {string} word - Sigment word
     * @returns {string|null} English translation or null if not found
     */
    translateToEnglish(word) {
        return this.toEnglish[word.toLowerCase()] || null;
    }

    /**
     * Get Sigment definition for a Sigment word
     * @param {string} word - Sigment word
     * @returns {string|null} Sigment definition or null if not found
     */
    getSigmentDefinition(word) {
        return this.sigmentDefinitions[word.toLowerCase()] || null;
    }

    /**
     * Search for words containing substring
     * @param {string} substring - Search term
     * @param {string} direction - 'english' or 'sigment'
     * @returns {Array} Matching words
     */
    searchWords(substring, direction = 'both') {
        const results = [];
        const term = substring.toLowerCase();

        if (direction === 'english' || direction === 'both') {
            for (const [english, sigment] of Object.entries(this.toSigment)) {
                if (english.includes(term)) {
                    results.push({ english, sigment, type: 'english' });
                }
            }
        }

        if (direction === 'sigment' || direction === 'both') {
            for (const [sigment, english] of Object.entries(this.toEnglish)) {
                if (sigment.includes(term)) {
                    results.push({ english, sigment, type: 'sigment' });
                }
            }
        }

        return results;
    }

    /**
     * Get language statistics
     * @returns {Object} Statistics about the language
     */
    getStats() {
        return {
            name: this.name,
            version: this.version,
            style: this.style,
            totalWords: Object.keys(this.toEnglish).length,
            hasDefinitions: Object.keys(this.sigmentDefinitions).length > 0,
            hasPhonetics: Object.keys(this.phonetics).length > 0,
            hasGrammar: Object.keys(this.grammar).length > 0,
            created: this.created
        };
    }

    /**
     * Export as JSON for saving
     * @returns {Object} Complete Sigment data
     */
    toJSON() {
        return this.data;
    }

    /**
     * Create a new Sigment language from scratch
     * @param {Object} config - Language configuration
     * @returns {SigmentLanguage} New language instance
     */
    static create(config) {
        const data = {
            sigment: {
                version: "1.0",
                language: {
                    name: config.name,
                    created: new Date().toISOString(),
                    style: config.style || "default",
                    generator_version: "1.0.0"
                },
                dictionaries: {
                    to_english: config.toEnglish || {},
                    to_sigment: config.toSigment || {},
                    sigment_definitions: config.sigmentDefinitions || {}
                },
                phonetics: config.phonetics || {},
                grammar: config.grammar || {},
                metadata: config.metadata || {}
            }
        };

        return new SigmentLanguage(data);
    }
}

/**
 * Utility functions for working with Sigment files
 */
export class SigmentUtils {
    /**
     * Check if file is a valid .sigment file
     * @param {string} filePath - File path to check
     * @returns {boolean} True if valid .sigment file
     */
    static isSigmentFile(filePath) {
        return path.extname(filePath).toLowerCase() === '.sigment';
    }

    /**
     * Find all .sigment files in directory
     * @param {string} dirPath - Directory to search
     * @param {boolean} recursive - Search recursively
     * @returns {Array} Array of .sigment file paths
     */
    static findSigmentFiles(dirPath, recursive = false) {
        const files = [];

        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isFile() && this.isSigmentFile(fullPath)) {
                    files.push(fullPath);
                } else if (entry.isDirectory() && recursive) {
                    files.push(...this.findSigmentFiles(fullPath, true));
                }
            }
        } catch (error) {
            console.warn(`Could not read directory ${dirPath}: ${error.message}`);
        }

        return files;
    }

    /**
     * Convert existing language files to .sigment format
     * @param {string} dictDir - Dictionary directory path
     * @param {string} languageName - Language name
     * @returns {SigmentLanguage} Converted language
     */
    static convertFromDictionaries(dictDir, languageName) {
        const toEnglishPath = path.join(dictDir, `${languageName}_to_English.json`);
        const toSigmentPath = path.join(dictDir, `English_to_${languageName}.json`);
        const definitionsPath = path.join(dictDir, `${languageName}_to_${languageName}.json`);
        const metadataPath = path.join(dictDir, `${languageName}_metadata.json`);

        let toEnglish = {};
        let toSigment = {};
        let sigmentDefinitions = {};
        let metadata = {};

        try {
            if (fs.existsSync(toEnglishPath)) {
                toEnglish = JSON.parse(fs.readFileSync(toEnglishPath, 'utf8'));
            }
            if (fs.existsSync(toSigmentPath)) {
                toSigment = JSON.parse(fs.readFileSync(toSigmentPath, 'utf8'));
            }
            if (fs.existsSync(definitionsPath)) {
                sigmentDefinitions = JSON.parse(fs.readFileSync(definitionsPath, 'utf8'));
            }
            if (fs.existsSync(metadataPath)) {
                metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            }
        } catch (error) {
            throw new Error(`Failed to convert dictionaries: ${error.message}`);
        }

        return SigmentLanguage.create({
            name: languageName,
            style: metadata.style || "default",
            toEnglish,
            toSigment,
            sigmentDefinitions,
            metadata
        });
    }
}

export default SigmentParser;