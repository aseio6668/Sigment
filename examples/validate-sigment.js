#!/usr/bin/env node

/**
 * Sigment File Validation Example
 * Demonstrates how to validate .sigment files
 */

import { SigmentParser, SigmentUtils } from '../src/sigment-parser.js';
import fs from 'fs';
import path from 'path';

class SigmentValidator {
    constructor() {
        this.parser = new SigmentParser();
    }

    /**
     * Validate a single .sigment file
     * @param {string} filePath - Path to .sigment file
     * @returns {Object} Validation result
     */
    validateFile(filePath) {
        const result = {
            file: filePath,
            valid: false,
            errors: [],
            warnings: [],
            stats: null
        };

        try {
            // Check if file exists and has correct extension
            if (!fs.existsSync(filePath)) {
                result.errors.push('File does not exist');
                return result;
            }

            if (!SigmentUtils.isSigmentFile(filePath)) {
                result.warnings.push('File does not have .sigment extension');
            }

            // Parse and validate
            const language = this.parser.parseFile(filePath);
            result.valid = true;
            result.stats = language.getStats();

            // Additional validation checks
            this.performDetailedValidation(language, result);

        } catch (error) {
            result.errors.push(error.message);
        }

        return result;
    }

    /**
     * Perform detailed validation on language object
     * @param {SigmentLanguage} language - Language to validate
     * @param {Object} result - Result object to populate
     */
    performDetailedValidation(language, result) {
        const stats = language.getStats();

        // Check dictionary completeness
        if (stats.totalWords < 5) {
            result.warnings.push('Language has very few words (less than 5)');
        }

        if (!stats.hasDefinitions) {
            result.warnings.push('Language lacks Sigment definitions dictionary');
        }

        if (!stats.hasPhonetics) {
            result.warnings.push('Language lacks phonetic rules');
        }

        if (!stats.hasGrammar) {
            result.warnings.push('Language lacks grammar rules');
        }

        // Check dictionary consistency
        const inconsistencies = this.checkDictionaryConsistency(language);
        if (inconsistencies.length > 0) {
            result.warnings.push(...inconsistencies);
        }

        // Check for empty values
        const emptyValues = this.checkForEmptyValues(language);
        if (emptyValues.length > 0) {
            result.warnings.push(...emptyValues);
        }
    }

    /**
     * Check dictionary consistency
     * @param {SigmentLanguage} language - Language to check
     * @returns {Array} Array of warning messages
     */
    checkDictionaryConsistency(language) {
        const warnings = [];
        const toEnglish = language.toEnglish;
        const toSigment = language.toSigment;

        // Check bidirectional consistency
        for (const [sigmentWord, englishWord] of Object.entries(toEnglish)) {
            if (toSigment[englishWord] !== sigmentWord) {
                warnings.push(`Dictionary inconsistency: "${sigmentWord}" -> "${englishWord}" but reverse mapping is different`);
            }
        }

        return warnings;
    }

    /**
     * Check for empty or invalid values
     * @param {SigmentLanguage} language - Language to check
     * @returns {Array} Array of warning messages
     */
    checkForEmptyValues(language) {
        const warnings = [];

        // Check for empty dictionary entries
        for (const [key, value] of Object.entries(language.toEnglish)) {
            if (!key.trim() || !value.trim()) {
                warnings.push(`Empty dictionary entry: "${key}" -> "${value}"`);
            }
        }

        for (const [key, value] of Object.entries(language.toSigment)) {
            if (!key.trim() || !value.trim()) {
                warnings.push(`Empty dictionary entry: "${key}" -> "${value}"`);
            }
        }

        return warnings;
    }

    /**
     * Validate all .sigment files in a directory
     * @param {string} dirPath - Directory to search
     * @param {boolean} recursive - Search recursively
     * @returns {Array} Array of validation results
     */
    validateDirectory(dirPath, recursive = false) {
        const sigmentFiles = SigmentUtils.findSigmentFiles(dirPath, recursive);
        const results = [];

        for (const filePath of sigmentFiles) {
            results.push(this.validateFile(filePath));
        }

        return results;
    }

    /**
     * Generate validation report
     * @param {Array} results - Array of validation results
     * @returns {Object} Summary report
     */
    generateReport(results) {
        const summary = {
            total: results.length,
            valid: 0,
            invalid: 0,
            warnings: 0,
            totalWords: 0,
            languages: []
        };

        for (const result of results) {
            if (result.valid) {
                summary.valid++;
                if (result.stats) {
                    summary.totalWords += result.stats.totalWords;
                }
            } else {
                summary.invalid++;
            }

            if (result.warnings.length > 0) {
                summary.warnings++;
            }

            summary.languages.push({
                file: path.basename(result.file),
                name: result.stats?.name || 'Unknown',
                valid: result.valid,
                words: result.stats?.totalWords || 0,
                errors: result.errors.length,
                warnings: result.warnings.length
            });
        }

        return summary;
    }

    /**
     * Print validation results
     * @param {Array} results - Array of validation results
     */
    printResults(results) {
        console.log('\n🔍 Sigment File Validation Results\n');
        console.log('═'.repeat(50));

        for (const result of results) {
            const fileName = path.basename(result.file);
            const status = result.valid ? '✅' : '❌';

            console.log(`\n${status} ${fileName}`);

            if (result.stats) {
                console.log(`   Language: ${result.stats.name}`);
                console.log(`   Words: ${result.stats.totalWords}`);
                console.log(`   Version: ${result.stats.version}`);
                console.log(`   Style: ${result.stats.style}`);
            }

            if (result.errors.length > 0) {
                console.log('   Errors:');
                for (const error of result.errors) {
                    console.log(`     ❌ ${error}`);
                }
            }

            if (result.warnings.length > 0) {
                console.log('   Warnings:');
                for (const warning of result.warnings) {
                    console.log(`     ⚠️  ${warning}`);
                }
            }
        }

        const summary = this.generateReport(results);
        console.log('\n' + '═'.repeat(50));
        console.log('\n📊 Summary:');
        console.log(`   Total files: ${summary.total}`);
        console.log(`   Valid: ${summary.valid}`);
        console.log(`   Invalid: ${summary.invalid}`);
        console.log(`   With warnings: ${summary.warnings}`);
        console.log(`   Total words: ${summary.totalWords}`);
    }
}

// CLI usage
function main() {
    const validator = new SigmentValidator();
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage:');
        console.log('  node validate-sigment.js <file.sigment>');
        console.log('  node validate-sigment.js <directory>');
        console.log('  node validate-sigment.js <directory> --recursive');
        console.log('\nExamples:');
        console.log('  node validate-sigment.js TechSigment.sigment');
        console.log('  node validate-sigment.js ./sigment-files/');
        console.log('  node validate-sigment.js ./languages/ --recursive');
        process.exit(1);
    }

    const targetPath = args[0];
    const recursive = args.includes('--recursive');

    let results = [];

    try {
        const stats = fs.statSync(targetPath);

        if (stats.isFile()) {
            // Validate single file
            results.push(validator.validateFile(targetPath));
        } else if (stats.isDirectory()) {
            // Validate directory
            results = validator.validateDirectory(targetPath, recursive);
        } else {
            console.error('❌ Invalid path:', targetPath);
            process.exit(1);
        }

        if (results.length === 0) {
            console.log('ℹ️  No .sigment files found');
            process.exit(0);
        }

        validator.printResults(results);

        // Exit with error code if any validation failed
        const hasErrors = results.some(r => !r.valid);
        process.exit(hasErrors ? 1 : 0);

    } catch (error) {
        console.error('❌ Validation failed:', error.message);
        process.exit(1);
    }
}

// Export for programmatic use
export { SigmentValidator };

// Run as CLI if called directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/')) ||
    process.argv[1].endsWith('validate-sigment.js')) {
    main();
}