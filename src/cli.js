#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import { LanguageGenerator } from './language-generator.js';
import { SigmentParser, SigmentUtils } from './sigment-parser.js';
import fs from 'fs/promises';
import path from 'path';

// Navigation helper for menus
class InteractiveMenu {
    static async listPrompt(options, includeBack = true) {
        // Add 'Back' option to choices if not already present and requested
        const choices = [...options.choices];
        if (includeBack && !choices.includes('Back') && !choices.some(c => c.value === 'back')) {
            choices.push(new inquirer.Separator());
            choices.push({ name: '← Back', value: 'back' });
        }

        const result = await inquirer.prompt([{
            ...options,
            choices: choices
        }]);

        return result;
    }

    static async confirmPrompt(options, includeBack = true) {
        if (includeBack) {
            // For confirm prompts, we'll convert to a list with Yes/No/Back options
            const result = await inquirer.prompt([{
                type: 'list',
                name: options.name,
                message: options.message,
                choices: [
                    { name: 'Yes', value: true },
                    { name: 'No', value: false },
                    new inquirer.Separator(),
                    { name: '← Back', value: 'back' }
                ]
            }]);
            return result;
        } else {
            return await inquirer.prompt([options]);
        }
    }

    static async inputPrompt(options, includeBack = true) {
        if (includeBack) {
            const actionResult = await inquirer.prompt([{
                type: 'list',
                name: 'action',
                message: `${options.message} or go back?`,
                choices: [
                    { name: `Enter ${options.message.toLowerCase()}`, value: 'input' },
                    { name: '← Back', value: 'back' }
                ]
            }]);

            if (actionResult.action === 'back') {
                return { [options.name]: 'back' };
            }

            // Proceed with input
            const inputResult = await inquirer.prompt([{
                ...options,
                validate: options.validate || (input => input.trim() ? true : 'Input is required')
            }]);
            
            return inputResult;
        } else {
            return await inquirer.prompt([options]);
        }
    }
}

const program = new Command();

program
    .name('sigment')
    .description('Sigment Language Constructor - Create languages based on etymological principles')
    .version('1.0.0');

program
    .command('generate')
    .description('Generate a new Sigment language')
    .option('-n, --name <name>', 'Name of the language')
    .option('-s, --style <style>', 'Transformation style (default, consonant_shift, vowel_harmony, morpheme_emphasis, phonetic_logic)', 'default')
    .option('-v, --vocabulary <words>', 'Comma-separated list of words or path to word file')
    .option('-p, --prompt <prompt>', 'Custom prompt for language generation')
    .option('-o, --output <path>', 'Output directory for dictionaries', './dictionaries')
    .option('--ascii-pronunciation', 'Use ASCII characters for pronunciation instead of IPA symbols')
    .option('--no-ollama', 'Disable Ollama integration')
    .option('--ollama-url <url>', 'Ollama server URL', 'http://localhost:11434')
    .option('--ollama-model <model>', 'Ollama model to use', 'llama3.2')
    .option('--batch-size <size>', 'Number of words to process in each batch', '10')
    .option('--save-interval <interval>', 'Save progress every N words', '25')
    .option('--no-pause', 'Disable pause/resume functionality')
    .option('-i, --interactive', 'Run in interactive mode')
    .action(async (options) => {
        if (options.interactive) {
            await runInteractiveMode();
        } else {
            await generateLanguage(options);
        }
    });

program
    .command('interactive')
    .description('Run in interactive mode')
    .action(async () => {
        await runInteractiveMode();
    });

program
    .command('translate')
    .description('Translate words between languages')
    .requiredOption('-l, --language <name>', 'Language name')
    .requiredOption('-w, --word <word>', 'Word to translate')
    .option('-d, --direction <direction>', 'Translation direction (to-english, to-sigment, sigment-def)', 'to-sigment')
    .action(async (options) => {
        await translateWord(options);
    });

program
    .command('list')
    .description('List available languages')
    .action(async () => {
        await listLanguages();
    });

program
    .command('info')
    .description('Show information about a language')
    .requiredOption('-l, --language <name>', 'Language name')
    .action(async (options) => {
        await showLanguageInfo(options);
    });

program
    .command('export')
    .description('Export language data')
    .requiredOption('-l, --language <name>', 'Language name')
    .requiredOption('-o, --output <path>', 'Output file path')
    .action(async (options) => {
        await exportLanguage(options);
    });

program
    .command('export-sigment')
    .description('Export language as .sigment file for external use')
    .requiredOption('-l, --language <name>', 'Language name')
    .requiredOption('-o, --output <path>', 'Output .sigment file path')
    .action(async (options) => {
        await exportSigmentFile(options);
    });

program
    .command('import')
    .description('Import language data')
    .requiredOption('-f, --file <path>', 'Input file path')
    .action(async (options) => {
        await importLanguage(options);
    });

program
    .command('import-sigment')
    .description('Import .sigment file')
    .requiredOption('-f, --file <path>', 'Input .sigment file path')
    .action(async (options) => {
        await importSigmentFile(options);
    });

program
    .command('add-words')
    .description('Add new words to an existing language')
    .requiredOption('-l, --language <name>', 'Language name')
    .requiredOption('-w, --words <words>', 'Comma-separated list of words to add')
    .option('--ascii-pronunciation', 'Use ASCII characters for pronunciation instead of IPA symbols')
    .option('--no-ollama', 'Disable Ollama integration')
    .option('--ollama-url <url>', 'Ollama server URL', 'http://localhost:11434')
    .option('--ollama-model <model>', 'Ollama model to use', 'llama3.2')
    .option('--batch-size <size>', 'Number of words to process in each batch', '10')
    .option('--save-interval <interval>', 'Save progress every N words', '25')
    .option('--resume', 'Resume from previous interrupted batch')
    .option('--no-pause', 'Disable pause/resume functionality')
    .action(async (options) => {
        await addWordsToLanguage(options);
    });

program
    .command('archive')
    .description('Archive a language (move to backup folder)')
    .requiredOption('-l, --language <name>', 'Language name to archive')
    .action(async (options) => {
        await archiveLanguage(options);
    });

program
    .command('restore')
    .description('Restore an archived language')
    .option('-l, --list', 'List available archived languages')
    .option('-n, --name <archiveName>', 'Archive name to restore')
    .action(async (options) => {
        await restoreLanguage(options);
    });

program
    .command('reconstruct')
    .description('Reconstruct dictionary with improved phonetic patterns')
    .requiredOption('-l, --language <name>', 'Language name to reconstruct')
    .option('--analyze-only', 'Only analyze patterns, don\'t reconstruct')
    .action(async (options) => {
        await reconstructLanguage(options);
    });

program
    .command('batch')
    .description('Batch processing utilities')
    .option('--pause', 'Create pause file to pause current batch operation')
    .option('--resume', 'Resume paused batch operation')
    .option('--status', 'Show status of current batch operations')
    .option('--clean', 'Clean up batch progress files')
    .action(async (options) => {
        await handleBatchUtils(options);
    });

async function runInteractiveMode() {
    console.log('\n🍅 Sigment Language Constructor - Interactive Mode');
    console.log('💡 Tip: Select ← Back to navigate between menus\n');

    let running = true;
    
    while (running) {
        const mainAction = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    'Generate a new language',
                    'Add words to existing language',
                    'Translate words',
                    'View existing languages',
                    'Import/Export languages',
                    'Archive/Restore languages',
                    'Reconstruct dictionary',
                    'Exit'
                ]
            }
        ]);

        switch (mainAction.action) {
            case 'Generate a new language':
                await interactiveGeneration();
                break;
            case 'Add words to existing language':
                await interactiveAddWords();
                break;
            case 'Translate words':
                await interactiveTranslation();
                break;
            case 'View existing languages':
                await interactiveLanguageViewer();
                break;
            case 'Import/Export languages':
                await interactiveImportExport();
                break;
            case 'Archive/Restore languages':
                await interactiveArchiveRestore();
                break;
            case 'Reconstruct dictionary':
                await interactiveReconstruct();
                break;
            case 'Exit':
                console.log('\nGoodbye!');
                running = false;
                break;
        }
    }
}

async function interactiveGeneration() {
    console.log('\n📚 Language Generation Setup\n');

    // Language name
    const nameResult = await InteractiveMenu.inputPrompt({
        type: 'input',
        name: 'name',
        message: 'Language name:',
        validate: input => input.trim() ? true : 'Language name is required'
    });

    if (nameResult.name === 'back') return;

    // Transformation style
    const styleResult = await InteractiveMenu.listPrompt({
        type: 'list',
        name: 'style',
        message: 'Transformation style:',
        choices: [
            { name: 'Default (balanced approach)', value: 'default' },
            { name: 'Consonant Shift (systematic consonant changes)', value: 'consonant_shift' },
            { name: 'Vowel Harmony (vowel consistency)', value: 'vowel_harmony' },
            { name: 'Morpheme Emphasis (emphasize word roots)', value: 'morpheme_emphasis' },
            { name: 'Phonetic Logic (maintain phonetic integrity)', value: 'phonetic_logic' }
        ],
        default: 'default'
    });

    if (styleResult.style === 'back') return;

    // ASCII pronunciation
    const asciiResult = await InteractiveMenu.confirmPrompt({
        name: 'asciiPronunciation',
        message: 'Use simple ASCII pronunciation (easier to read)?',
        default: false
    });

    if (asciiResult.asciiPronunciation === 'back') return;

    // Vocabulary source
    const vocabularySourceResult = await InteractiveMenu.listPrompt({
        type: 'list',
        name: 'vocabularySource',
        message: 'Vocabulary source:',
        choices: [
            { name: 'Common English words (automatic)', value: 'common' },
            { name: 'Custom word list (manual entry)', value: 'manual' },
            { name: 'Load from file', value: 'file' }
        ]
    });

    if (vocabularySourceResult.vocabularySource === 'back') return;

    const config = {
        name: nameResult.name,
        style: styleResult.style,
        asciiPronunciation: asciiResult.asciiPronunciation,
        vocabularySource: vocabularySourceResult.vocabularySource
    };

    let vocabulary = [];
    
    if (config.vocabularySource === 'manual') {
        const wordsInput = await inquirer.prompt([
            {
                type: 'editor',
                name: 'words',
                message: 'Enter words (one per line or comma-separated):'
            }
        ]);
        vocabulary = wordsInput.words.split(/[,\n]/).map(w => w.trim()).filter(w => w);
    } else if (config.vocabularySource === 'file') {
        const fileResult = await InteractiveMenu.inputPrompt({
            type: 'input',
            name: 'filePath',
            message: 'Path to word list file:'
        });
        
        if (fileResult.filePath === 'back') return;
        vocabulary = `file:${fileResult.filePath}`;
    }

    // Custom prompt option
    const customPromptResult = await InteractiveMenu.confirmPrompt({
        name: 'useCustomPrompt',
        message: 'Use custom generation prompt?',
        default: false
    });

    if (customPromptResult.useCustomPrompt === 'back') return;

    // Ollama option
    const ollamaResult = await InteractiveMenu.confirmPrompt({
        name: 'useOllama',
        message: 'Use Ollama for enhanced etymological analysis?',
        default: true
    });

    if (ollamaResult.useOllama === 'back') return;

    const advancedOptions = {
        useCustomPrompt: customPromptResult.useCustomPrompt,
        useOllama: ollamaResult.useOllama
    };

    let customPrompt = '';
    if (advancedOptions.useCustomPrompt) {
        const promptInput = await inquirer.prompt([
            {
                type: 'editor',
                name: 'prompt',
                message: 'Enter your custom prompt for language generation:'
            }
        ]);
        customPrompt = promptInput.prompt;
    }

    const ollamaConfig = {};
    if (advancedOptions.useOllama) {
        const urlResult = await InteractiveMenu.inputPrompt({
            type: 'input',
            name: 'url',
            message: 'Ollama server URL:',
            default: 'http://localhost:11434'
        });

        if (urlResult.url === 'back') return;

        const modelResult = await InteractiveMenu.inputPrompt({
            type: 'input',
            name: 'model',
            message: 'Ollama model:',
            default: 'llama3.2'
        });

        if (modelResult.model === 'back') return;

        ollamaConfig.ollamaUrl = urlResult.url;
        ollamaConfig.ollamaModel = modelResult.model;
    }

    console.log('\n🔄 Generating language...\n');

    const generator = new LanguageGenerator({
        useOllama: advancedOptions.useOllama,
        ...ollamaConfig,
        outputPath: './dictionaries'
    });

    try {
        const result = await generator.generateLanguage({
            name: config.name,
            style: config.style,
            vocabulary,
            customPrompt,
            etymologicalDepth: 'high',
            asciiPronunciation: config.asciiPronunciation
        });

        console.log('\n✅ Language generation complete!\n');
        console.log(`Language: ${result.language.config.name}`);
        console.log(`Words processed: ${result.stats.wordsProcessed}`);
        console.log(`Generation time: ${Math.round(result.stats.elapsedTime / 1000)}s`);
        
        if (result.stats.errors.length > 0) {
            console.log(`Errors encountered: ${result.stats.errors.length}`);
        }

        console.log('\nDictionary files created:');
        for (const [type, path] of Object.entries(result.dictionaries)) {
            console.log(`  ${type}: ${path}`);
        }

        const viewSample = await InteractiveMenu.confirmPrompt({
            name: 'view',
            message: 'View a sample of generated words?',
            default: true
        }, false); // Don't include back option for final confirmation

        if (viewSample.view) {
            displaySampleWords(result.language);
        }

    } catch (error) {
        console.error('❌ Language generation failed:', error.message);
    }
}

async function interactiveTranslation() {
    const generator = new LanguageGenerator();
    const languages = await generator.getAvailableLanguages();

    if (languages.length === 0) {
        console.log('\n❌ No languages available. Generate a language first.\n');
        return;
    }

    // Select language
    const languageResult = await InteractiveMenu.listPrompt({
        type: 'list',
        name: 'language',
        message: 'Select language:',
        choices: languages
    });

    if (languageResult.language === 'back') return;

    // Select translation direction
    const directionResult = await InteractiveMenu.listPrompt({
        type: 'list',
        name: 'direction',
        message: 'Translation direction:',
        choices: [
            { name: `English → ${languageResult.language}`, value: 'to-sigment' },
            { name: `${languageResult.language} → English`, value: 'to-english' },
            { name: `${languageResult.language} definition`, value: 'sigment-def' }
        ]
    });

    if (directionResult.direction === 'back') return;

    // Enter word to translate
    const wordResult = await InteractiveMenu.inputPrompt({
        type: 'input',
        name: 'word',
        message: 'Word to translate:',
        validate: input => input.trim() ? true : 'Word is required'
    });

    if (wordResult.word === 'back') return;

    const translationConfig = {
        language: languageResult.language,
        direction: directionResult.direction,
        word: wordResult.word
    };

    try {
        await translateWord({
            language: translationConfig.language,
            word: translationConfig.word,
            direction: translationConfig.direction
        });
    } catch (error) {
        console.error('❌ Translation failed:', error.message);
    }
}

async function interactiveLanguageViewer() {
    const generator = new LanguageGenerator();
    const languages = await generator.getAvailableLanguages();

    if (languages.length === 0) {
        console.log('\n❌ No languages available.\n');
        return;
    }

    const selection = await InteractiveMenu.listPrompt({
        type: 'list',
        name: 'language',
        message: 'Select language to view:',
        choices: languages
    });

    if (selection.language === 'back') return;

    await showLanguageInfo({ language: selection.language });
}

async function interactiveImportExport() {
    const action = await InteractiveMenu.listPrompt({
        type: 'list',
        name: 'action',
        message: 'Import or Export?',
        choices: ['Export language', 'Import language']
    });

    // Handle back navigation
    if (action.action === 'back') {
        return;
    }

    if (action.action === 'Export language') {
        const generator = new LanguageGenerator();
        const languages = await generator.getAvailableLanguages();

        if (languages.length === 0) {
            console.log('\n❌ No languages available to export.\n');
            return;
        }

        // Select language to export
        const languageResult = await InteractiveMenu.listPrompt({
            type: 'list',
            name: 'language',
            message: 'Select language to export:',
            choices: languages
        });

        if (languageResult.language === 'back') return;

        // Enter output file path
        const outputResult = await InteractiveMenu.inputPrompt({
            type: 'input',
            name: 'output',
            message: 'Output file path:',
            default: `./${languageResult.language}_export.json`
        });

        if (outputResult.output === 'back') return;

        await exportLanguage({
            language: languageResult.language,
            output: outputResult.output
        });
    } else {
        // Enter file path to import
        const fileResult = await InteractiveMenu.inputPrompt({
            type: 'input',
            name: 'file',
            message: 'Path to language file:',
            validate: input => input.trim() ? true : 'File path is required'
        });

        if (fileResult.file === 'back') return;

        await importLanguage({ file: fileResult.file });
    }
}

async function generateLanguage(options) {
    console.log(`\n🔄 Generating language: ${options.name || 'Unnamed'}\n`);

    let vocabulary = [];
    if (options.vocabulary) {
        if (options.vocabulary.startsWith('file:')) {
            vocabulary = options.vocabulary;
        } else {
            vocabulary = options.vocabulary.split(',').map(w => w.trim().replace(/^["']|["']$/g, ''));
        }
    }

    const generator = new LanguageGenerator({
        useOllama: options.ollama !== false,
        ollamaUrl: options.ollamaUrl,
        ollamaModel: options.ollamaModel,
        outputPath: options.output
    });

    try {
        const result = await generator.generateLanguage({
            name: options.name || 'CustomSigment',
            style: options.style,
            vocabulary,
            customPrompt: options.prompt || '',
            etymologicalDepth: 'medium',
            asciiPronunciation: options.asciiPronunciation || false
        });

        console.log('✅ Language generation complete!');
        console.log(`Words processed: ${result.stats.wordsProcessed}`);
        console.log(`Generation time: ${Math.round(result.stats.elapsedTime / 1000)}s`);
        
        if (result.stats.errors.length > 0) {
            console.log(`Errors: ${result.stats.errors.length}`);
        }

        console.log('\nDictionary files:');
        for (const [type, path] of Object.entries(result.dictionaries)) {
            console.log(`  ${type}: ${path}`);
        }

    } catch (error) {
        console.error('❌ Generation failed:', error.message);
        process.exit(1);
    }
}

async function translateWord(options) {
    try {
        const dictPath = path.resolve('./dictionaries');
        let dictFile;

        switch (options.direction) {
            case 'to-english':
                dictFile = path.join(dictPath, `${options.language}_to_English.json`);
                break;
            case 'to-sigment':
                dictFile = path.join(dictPath, `English_to_${options.language}.json`);
                break;
            case 'sigment-def':
                dictFile = path.join(dictPath, `${options.language}_to_${options.language}.json`);
                break;
        }

        const dictContent = await fs.readFile(dictFile, 'utf-8');
        const dictData = JSON.parse(dictContent);

        const word = options.word.toLowerCase();
        const entry = dictData.dictionary[word] || dictData.dictionary[options.word];

        if (entry) {
            console.log(`\n📖 Translation for "${options.word}":\n`);
            
            if (options.direction === 'to-english') {
                console.log(`Sigment: ${options.word}`);
                console.log(`English: ${entry.english}`);
                console.log(`Pronunciation: ${entry.pronunciation}`);
                console.log(`Definitions: ${entry.definitions.join(', ')}`);
                if (entry.partOfSpeech) {
                    console.log(`Part of Speech: ${entry.partOfSpeech}`);
                }
            } else if (options.direction === 'to-sigment') {
                console.log(`English: ${options.word}`);
                console.log(`Sigment: ${entry.sigment}`);
                console.log(`Pronunciation: ${entry.pronunciation}`);
                console.log(`Definitions: ${entry.definitions.join(', ')}`);
            } else {
                console.log(`Sigment: ${options.word}`);
                console.log(`Definitions in ${options.language}: ${entry.definitions.join(', ')}`);
                console.log(`Pronunciation: ${entry.pronunciation}`);
                if (entry.relatedWords && entry.relatedWords.length > 0) {
                    console.log(`Related words: ${entry.relatedWords.join(', ')}`);
                }
            }
        } else {
            console.log(`❌ Word "${options.word}" not found in ${options.language} dictionary`);
        }

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`❌ Dictionary file not found for language "${options.language}"`);
        } else {
            console.error('❌ Translation failed:', error.message);
        }
    }
}

async function listLanguages() {
    try {
        const dictPath = path.resolve('./dictionaries');
        const files = await fs.readdir(dictPath);
        const metadataFiles = files.filter(f => f.endsWith('_metadata.json'));

        if (metadataFiles.length === 0) {
            console.log('\n❌ No languages found.\n');
            return;
        }

        console.log('\n📚 Available Languages:\n');

        for (const file of metadataFiles) {
            const filePath = path.join(dictPath, file);
            const metadata = JSON.parse(await fs.readFile(filePath, 'utf-8'));
            
            console.log(`• ${metadata.config.name}`);
            console.log(`  Created: ${new Date(metadata.created).toLocaleDateString()}`);
            console.log(`  Words: ${metadata.vocabularySize}`);
            console.log(`  Style: ${metadata.config.style}`);
            console.log();
        }

    } catch (error) {
        console.error('❌ Failed to list languages:', error.message);
    }
}

async function showLanguageInfo(options) {
    try {
        const dictPath = path.resolve('./dictionaries');
        const metadataFile = path.join(dictPath, `${options.language}_metadata.json`);
        
        const metadata = JSON.parse(await fs.readFile(metadataFile, 'utf-8'));

        console.log(`\n📖 Language Information: ${metadata.config.name}\n`);
        console.log(`Created: ${new Date(metadata.created).toLocaleDateString()}`);
        console.log(`Version: ${metadata.version}`);
        console.log(`Vocabulary Size: ${metadata.vocabularySize} words`);
        console.log(`Transformation Style: ${metadata.config.style}`);
        
        if (metadata.phoneticSystem) {
            console.log(`Vowels: ${metadata.phoneticSystem.vowelInventory?.join(', ') || 'N/A'}`);
            console.log(`Consonants: ${metadata.phoneticSystem.consonantInventory?.join(', ') || 'N/A'}`);
        }

        if (metadata.generationStats) {
            console.log(`\nGeneration Stats:`);
            console.log(`  Processing Time: ${Math.round(metadata.generationStats.elapsedTime / 1000)}s`);
            console.log(`  Errors: ${metadata.generationStats.errors?.length || 0}`);
        }

        if (metadata.config.culturalThemes) {
            console.log(`\nCultural Themes: ${metadata.config.culturalThemes.join(', ')}`);
        }

        console.log();

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`❌ Language "${options.language}" not found`);
        } else {
            console.error('❌ Failed to show language info:', error.message);
        }
    }
}

async function exportLanguage(options) {
    try {
        const generator = new LanguageGenerator();
        const filePath = await generator.saveLanguageData(options.language, options.output);
        console.log(`✅ Language exported to: ${filePath}`);
    } catch (error) {
        console.error('❌ Export failed:', error.message);
    }
}

async function importLanguage(options) {
    try {
        const generator = new LanguageGenerator();
        const language = await generator.loadLanguageData(options.file);
        console.log(`✅ Language "${language.config.name}" imported successfully`);
    } catch (error) {
        console.error('❌ Import failed:', error.message);
    }
}

async function addWordsToLanguage(options) {
    console.log(`\n➕ Adding words to language: ${options.language}\n`);

    try {
        const words = options.words.split(',').map(w => w.trim().replace(/^["']|["']$/g, ''));
        console.log(`Words to add: ${words.join(', ')}`);

        const generator = new LanguageGenerator({
            useOllama: options.ollama !== false,
            ollamaUrl: options.ollamaUrl,
            ollamaModel: options.ollamaModel,
            outputPath: './dictionaries'
        });

        const batchOptions = {
            asciiPronunciation: options.asciiPronunciation || false,
            batchSize: parseInt(options.batchSize) || 10,
            saveInterval: parseInt(options.saveInterval) || 25,
            allowPause: !options.noPause
        };

        console.log(`\n🔧 Batch processing options:`);
        console.log(`   Batch size: ${batchOptions.batchSize} words`);
        console.log(`   Save interval: every ${batchOptions.saveInterval} words`);
        console.log(`   Pause/resume: ${batchOptions.allowPause ? 'enabled' : 'disabled'}`);
        
        if (batchOptions.allowPause) {
            console.log(`\n💡 Batch processing tips:`);
            console.log(`   • Press Ctrl+C to gracefully exit and save progress`);
            console.log(`   • Create a file named '.pause' in dictionaries folder to pause`);
            console.log(`   • Use --resume flag to continue interrupted operations`);
        }

        const result = await generator.addWordsToLanguage(options.language, words, batchOptions);

        if (result.wasStopped) {
            console.log(`\n⏸️  Operation was paused/stopped`);
            console.log(`Added: ${result.addedCount} words before stopping`);
            console.log(`Remaining: ${result.skippedCount} words`);
            console.log(`\n💡 Resume with: sigment add-words -l ${options.language} -w "${options.words}" --resume`);
        } else {
            console.log(`\n✅ Word addition complete!`);
            console.log(`Added: ${result.addedCount} new words`);
            if (result.skippedCount > 0) {
                console.log(`Skipped: ${result.skippedCount} words (already exist)`);
            }

            // Show some of the new words
            if (result.addedCount > 0) {
                console.log('\n📝 New words added:');
                const newWords = Array.from(result.language.vocabulary.entries())
                    .filter(([english]) => words.includes(english))
                    .slice(0, 5);
                
                for (const [english, entry] of newWords) {
                    console.log(`  ${english} → ${entry.sigment} ${entry.pronunciation}`);
                }
            }

            // Check for reconstruction recommendation
            if (result.reconstructionRecommendation && result.reconstructionRecommendation.shouldReconstruct) {
                console.log('\n🔍 Dictionary Reconstruction Analysis:');
                console.log(`Current phonetic consistency: ${result.reconstructionRecommendation.currentConsistency.toFixed(1)}%`);
                console.log('Reconstruction recommended because:');
                for (const reason of result.reconstructionRecommendation.reasons) {
                    console.log(`  • ${reason}`);
                }
                console.log('\n💡 Run "sigment reconstruct --language ' + options.language + '" to improve dictionary consistency.');
            }
        }

    } catch (error) {
        console.error('❌ Failed to add words:', error.message);
        process.exit(1);
    }
}

async function interactiveAddWords() {
    console.log('\n➕ Add Words to Existing Language\n');

    const generator = new LanguageGenerator();
    const languages = await generator.getAvailableLanguages();

    if (languages.length === 0) {
        console.log('\n❌ No languages available. Generate a language first.\n');
        return;
    }

    // Select language
    const languageResult = await InteractiveMenu.listPrompt({
        type: 'list',
        name: 'language',
        message: 'Select language to add words to:',
        choices: languages
    });

    if (languageResult.language === 'back') return;

    // Select input method
    const inputMethodResult = await InteractiveMenu.listPrompt({
        type: 'list',
        name: 'inputMethod',
        message: 'How would you like to add words?',
        choices: [
            { name: 'Type words manually', value: 'manual' },
            { name: 'Load from file', value: 'file' }
        ]
    });

    if (inputMethodResult.inputMethod === 'back') return;

    // ASCII pronunciation option
    const asciiResult = await InteractiveMenu.confirmPrompt({
        name: 'asciiPronunciation',
        message: 'Override pronunciation format to use simple ASCII (easier to read)?',
        default: false
    });

    if (asciiResult.asciiPronunciation === 'back') return;

    const config = {
        language: languageResult.language,
        inputMethod: inputMethodResult.inputMethod,
        asciiPronunciation: asciiResult.asciiPronunciation
    };

    let words = [];
    
    if (config.inputMethod === 'manual') {
        const wordsInput = await inquirer.prompt([
            {
                type: 'editor',
                name: 'words',
                message: 'Enter words (one per line or comma-separated):'
            }
        ]);
        words = wordsInput.words.split(/[,\n]/).map(w => w.trim()).filter(w => w);
    } else {
        const fileResult = await InteractiveMenu.inputPrompt({
            type: 'input',
            name: 'filePath',
            message: 'Path to word list file:'
        });
        
        if (fileResult.filePath === 'back') return;
        
        try {
            const fs = await import('fs/promises');
            const content = await fs.readFile(fileResult.filePath, 'utf-8');
            words = content.split(/\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
        } catch (error) {
            console.error(`❌ Failed to read file: ${error.message}`);
            return;
        }
    }

    if (words.length === 0) {
        console.log('\n❌ No words provided.\n');
        return;
    }

    const ollamaResult = await InteractiveMenu.confirmPrompt({
        name: 'useOllama',
        message: 'Use Ollama for enhanced etymological analysis?',
        default: true
    });

    if (ollamaResult.useOllama === 'back') return;

    const advancedOptions = {
        useOllama: ollamaResult.useOllama
    };

    console.log(`\n🔄 Adding ${words.length} words to ${config.language}...\n`);

    try {
        const generator = new LanguageGenerator({
            useOllama: advancedOptions.useOllama,
            outputPath: './dictionaries'
        });

        const result = await generator.addWordsToLanguage(config.language, words, {
            asciiPronunciation: config.asciiPronunciation
        });

        console.log('\n✅ Word addition complete!\n');
        console.log(`Added: ${result.addedCount} new words`);
        if (result.skippedCount > 0) {
            console.log(`Skipped: ${result.skippedCount} words (already existed)`);
        }

        if (result.addedCount > 0) {
            const viewSample = await InteractiveMenu.confirmPrompt({
                name: 'view',
                message: 'View a sample of the newly added words?',
                default: true
            }, false); // No back option for final confirmation

            if (viewSample.view) {
                console.log('\n📝 Sample of newly added words:\n');
                const newWords = Array.from(result.language.vocabulary.entries())
                    .filter(([english]) => words.includes(english))
                    .slice(0, 10);
                
                for (const [english, entry] of newWords) {
                    console.log(`${english} → ${entry.sigment} ${entry.pronunciation}`);
                    if (entry.definitions.primary.length > 0) {
                        console.log(`  ${entry.definitions.primary[0]}`);
                    }
                    console.log();
                }
            }
        }

        // Check for reconstruction recommendation
        if (result.reconstructionRecommendation && result.reconstructionRecommendation.shouldReconstruct) {
            console.log('\n🔍 Dictionary Reconstruction Analysis:\n');
            console.log(`Current phonetic consistency: ${result.reconstructionRecommendation.currentConsistency.toFixed(1)}%`);
            console.log('Reconstruction recommended because:');
            for (const reason of result.reconstructionRecommendation.reasons) {
                console.log(`  • ${reason}`);
            }

            const reconstructPrompt = await InteractiveMenu.confirmPrompt({
                name: 'reconstruct',
                message: 'Would you like to reconstruct the dictionary for better consistency?',
                default: false
            }, false); // No back option for final confirmation

            if (reconstructPrompt.reconstruct) {
                console.log('\n🔄 Reconstructing dictionary...\n');
                const reconstructResult = await generator.reconstructDictionary(result.language, {
                    beforeConsistency: result.reconstructionRecommendation.currentConsistency
                });

                console.log('\n✅ Dictionary reconstruction complete!\n');
                console.log(`Words reconstructed: ${reconstructResult.reconstructedWords}`);
                console.log(`Words changed: ${reconstructResult.changedWords}`);
                console.log(`Consistency improvement: ${reconstructResult.consistencyImprovement.before.toFixed(1)}% → ${reconstructResult.consistencyImprovement.after.toFixed(1)}% (+${reconstructResult.consistencyImprovement.improvement.toFixed(1)}%)`);

                if (reconstructResult.changes.length > 0) {
                    console.log('\n📝 Sample word changes:');
                    for (const change of reconstructResult.changes.slice(0, 5)) {
                        console.log(`  ${change.english}: ${change.old} → ${change.new}`);
                    }
                    if (reconstructResult.totalChanges > 5) {
                        console.log(`  ... and ${reconstructResult.totalChanges - 5} more changes`);
                    }
                }

                // Regenerate dictionaries with reconstructed vocabulary
                await generator.generateDictionaries(result.language);
                console.log('\n📚 Dictionary files updated with reconstructed vocabulary!');
            }
        }

    } catch (error) {
        console.error('❌ Failed to add words:', error.message);
    }
}

function displaySampleWords(language) {
    console.log('\n📝 Sample Words:\n');
    
    const entries = Array.from(language.vocabulary.entries()).slice(0, 10);
    
    for (const [english, entry] of entries) {
        console.log(`${english} → ${entry.sigment} ${entry.pronunciation}`);
        if (entry.definitions.primary.length > 0) {
            console.log(`  ${entry.definitions.primary[0]}`);
        }
        console.log();
    }
}

async function interactiveArchiveRestore() {
    console.log('\n🗂️  Archive/Restore Languages\n');

    const action = await InteractiveMenu.listPrompt({
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
            'Archive a language',
            'Restore archived language',
            'View archived languages'
        ]
    });

    // Handle back navigation
    if (action.action === 'back') {
        return;
    }

    switch (action.action) {
        case 'Archive a language':
            await interactiveArchiveLanguage();
            break;
        case 'Restore archived language':
            await interactiveRestoreLanguage();
            break;
        case 'View archived languages':
            await viewArchivedLanguages();
            break;
    }
}

async function interactiveArchiveLanguage() {
    const generator = new LanguageGenerator();
    const languages = await generator.getAvailableLanguages();

    if (languages.length === 0) {
        console.log('No languages found to archive.');
        return;
    }

    // Select language to archive
    const languageResult = await InteractiveMenu.listPrompt({
        type: 'list',
        name: 'language',
        message: 'Select language to archive:',
        choices: languages
    });

    if (languageResult.language === 'back') return;

    // Confirm archive action
    const confirmResult = await InteractiveMenu.confirmPrompt({
        name: 'confirm',
        message: `Are you sure you want to archive "${languageResult.language}"? This will move it to the backup folder.`,
        default: false
    });

    if (confirmResult.confirm === 'back') return;

    if (!confirmResult.confirm) {
        console.log('Archive cancelled.');
        return;
    }

    const selection = {
        language: languageResult.language,
        confirm: confirmResult.confirm
    };

    try {
        console.log(`\n🗂️  Archiving language: ${selection.language}`);
        const result = await generator.archiveLanguage(selection.language);
        
        console.log('\n✅ Language archived successfully!\n');
        console.log(`Language: ${selection.language}`);
        console.log(`Files archived: ${result.archivedFiles}`);
        console.log(`Archive location: ${result.archivePath}`);
        console.log(`Timestamp: ${result.timestamp}`);
        
    } catch (error) {
        console.error('❌ Failed to archive language:', error.message);
    }
}

async function interactiveRestoreLanguage() {
    const generator = new LanguageGenerator();
    const archived = await generator.getArchivedLanguages();

    if (archived.length === 0) {
        console.log('No archived languages found.');
        return;
    }

    const choices = archived.map(arch => ({
        name: `${arch.name} (archived: ${arch.archivedDate.toLocaleDateString()})`,
        value: arch.archiveName
    }));

    // Select archived language
    const archiveResult = await InteractiveMenu.listPrompt({
        type: 'list',
        name: 'archive',
        message: 'Select archived language to restore:',
        choices: choices
    });

    if (archiveResult.archive === 'back') return;

    // Confirm restore action
    const confirmResult = await InteractiveMenu.confirmPrompt({
        name: 'confirm',
        message: 'Are you sure you want to restore this language?',
        default: true
    });

    if (confirmResult.confirm === 'back') return;

    if (!confirmResult.confirm) {
        console.log('Restore cancelled.');
        return;
    }

    const selection = {
        archive: archiveResult.archive,
        confirm: confirmResult.confirm
    };

    try {
        console.log(`\n📥 Restoring archived language...`);
        const result = await generator.restoreLanguage(selection.archive);
        
        console.log('\n✅ Language restored successfully!\n');
        console.log(`Language: ${result.languageName}`);
        console.log(`Files restored: ${result.restoredFiles}`);
        console.log(`Archive: ${result.archiveName}`);
        
    } catch (error) {
        console.error('❌ Failed to restore language:', error.message);
    }
}

async function viewArchivedLanguages() {
    const generator = new LanguageGenerator();
    const archived = await generator.getArchivedLanguages();

    if (archived.length === 0) {
        console.log('No archived languages found.');
        return;
    }

    console.log('\n🗂️  Archived Languages:\n');
    
    for (const arch of archived) {
        console.log(`📁 ${arch.name}`);
        console.log(`   Archived: ${arch.archivedDate.toLocaleDateString()} ${arch.archivedDate.toLocaleTimeString()}`);
        console.log(`   Archive: ${arch.archiveName}`);
        if (arch.metadata && arch.metadata.wordCount) {
            console.log(`   Words: ${arch.metadata.wordCount}`);
        }
        if (arch.metadata && arch.metadata.version) {
            console.log(`   Version: ${arch.metadata.version}`);
        }
        console.log();
    }
}

async function interactiveReconstruct() {
    console.log('\n🔧 Reconstruct Dictionary\n');
    
    const generator = new LanguageGenerator();
    const languages = await generator.getAvailableLanguages();

    if (languages.length === 0) {
        console.log('No languages found to reconstruct.');
        return;
    }

    const selection = await InteractiveMenu.listPrompt({
        type: 'list',
        name: 'language',
        message: 'Select language to reconstruct:',
        choices: languages
    });

    if (selection.language === 'back') return;

    console.log(`\n🔄 Analyzing ${selection.language} for reconstruction...\n`);

    try {
        // Load the language
        const language = await generator.loadFullLanguageData(selection.language);
        if (!language) {
            console.log(`❌ Language "${selection.language}" not found.`);
            return;
        }

        // Check if reconstruction is recommended
        const recommendation = await generator.shouldReconstructDictionary(language);
        
        if (!recommendation.shouldReconstruct) {
            console.log(`✅ Dictionary for "${selection.language}" is already well-optimized!`);
            console.log(`Current phonetic consistency: ${recommendation.currentConsistency.toFixed(1)}%`);
            console.log('No reconstruction needed at this time.');
            return;
        }

        console.log('🔍 Reconstruction Analysis:\n');
        console.log(`Current phonetic consistency: ${recommendation.currentConsistency.toFixed(1)}%`);
        console.log('Reconstruction recommended because:');
        for (const reason of recommendation.reasons) {
            console.log(`  • ${reason}`);
        }

        const confirmPrompt = await InteractiveMenu.confirmPrompt({
            name: 'proceed',
            message: 'Proceed with dictionary reconstruction?',
            default: true
        });

        if (confirmPrompt.proceed === 'back') return;

        if (!confirmPrompt.proceed) {
            console.log('Reconstruction cancelled.');
            return;
        }

        console.log('\n🔄 Reconstructing dictionary...\n');
        const reconstructResult = await generator.reconstructDictionary(language, {
            beforeConsistency: recommendation.currentConsistency
        });

        console.log('\n✅ Dictionary reconstruction complete!\n');
        console.log(`Words reconstructed: ${reconstructResult.reconstructedWords}`);
        console.log(`Words changed: ${reconstructResult.changedWords}`);
        console.log(`Consistency improvement: ${reconstructResult.consistencyImprovement.before.toFixed(1)}% → ${reconstructResult.consistencyImprovement.after.toFixed(1)}% (+${reconstructResult.consistencyImprovement.improvement.toFixed(1)}%)`);

        if (reconstructResult.changes.length > 0) {
            console.log('\n📝 Sample word changes:');
            for (const change of reconstructResult.changes.slice(0, 10)) {
                console.log(`  ${change.english}: ${change.old} → ${change.new}`);
            }
            if (reconstructResult.changes.length > 10) {
                console.log(`  ... and ${reconstructResult.changes.length - 10} more changes`);
            }
        }

        // Update dictionary files
        await generator.generateDictionaries(language);
        console.log('\n📚 Dictionary files updated successfully!');
        
    } catch (error) {
        console.error('❌ Failed to reconstruct dictionary:', error.message);
    }
}

async function archiveLanguage(options) {
    console.log(`\n🗂️  Archiving language: ${options.language}\n`);
    
    try {
        const generator = new LanguageGenerator();
        const result = await generator.archiveLanguage(options.language);
        
        console.log('✅ Language archived successfully!\n');
        console.log(`Language: ${options.language}`);
        console.log(`Files archived: ${result.archivedFiles}`);
        console.log(`Archive location: ${result.archivePath}`);
        
    } catch (error) {
        console.error('❌ Failed to archive language:', error.message);
        process.exit(1);
    }
}

async function restoreLanguage(options) {
    try {
        const generator = new LanguageGenerator();
        
        if (options.list) {
            const archived = await generator.getArchivedLanguages();
            
            if (archived.length === 0) {
                console.log('No archived languages found.');
                return;
            }
            
            console.log('\n🗂️  Available Archives:\n');
            for (const arch of archived) {
                console.log(`📁 ${arch.archiveName} (${arch.name})`);
                console.log(`   Archived: ${arch.archivedDate.toLocaleDateString()}`);
                if (arch.metadata && arch.metadata.wordCount) {
                    console.log(`   Words: ${arch.metadata.wordCount}`);
                }
                console.log();
            }
            return;
        }
        
        if (!options.name) {
            console.error('❌ Archive name is required. Use --name <archiveName> or --list to see available archives.');
            process.exit(1);
        }
        
        console.log(`\n📥 Restoring language from archive: ${options.name}\n`);
        const result = await generator.restoreLanguage(options.name);
        
        console.log('✅ Language restored successfully!\n');
        console.log(`Language: ${result.languageName}`);
        console.log(`Files restored: ${result.restoredFiles}`);
        
    } catch (error) {
        console.error('❌ Failed to restore language:', error.message);
        process.exit(1);
    }
}

async function reconstructLanguage(options) {
    console.log(`\n🔍 Analyzing language: ${options.language}\n`);
    
    try {
        const generator = new LanguageGenerator();
        await generator.initializationPromise; // Wait for initialization
        const language = await generator.loadFullLanguageData(options.language);
        
        if (!language) {
            console.error(`❌ Language "${options.language}" not found.`);
            process.exit(1);
        }

        const analysis = await generator.shouldReconstructDictionary(language);
        
        console.log(`📊 Current phonetic consistency: ${analysis.currentConsistency.toFixed(1)}%`);
        console.log(`📚 Vocabulary size: ${language.vocabulary.size} words`);
        
        if (analysis.shouldReconstruct) {
            console.log('\n🔍 Reconstruction recommended because:');
            for (const reason of analysis.reasons) {
                console.log(`  • ${reason}`);
            }
        } else {
            console.log('\n✅ Dictionary is already well-optimized. No reconstruction needed.');
        }

        if (options.analyzeOnly) {
            console.log('\n📋 Analysis complete (analyze-only mode).');
            return;
        }

        if (!analysis.shouldReconstruct) {
            console.log('\nNo reconstruction needed at this time.');
            return;
        }

        console.log('\n🔄 Proceeding with dictionary reconstruction...\n');
        const reconstructResult = await generator.reconstructDictionary(language, {
            beforeConsistency: analysis.currentConsistency
        });

        console.log('✅ Dictionary reconstruction complete!\n');
        console.log(`Words processed: ${reconstructResult.reconstructedWords}`);
        console.log(`Words changed: ${reconstructResult.changedWords}`);
        console.log(`Consistency improvement: ${reconstructResult.consistencyImprovement.before.toFixed(1)}% → ${reconstructResult.consistencyImprovement.after.toFixed(1)}% (+${reconstructResult.consistencyImprovement.improvement.toFixed(1)}%)`);

        if (reconstructResult.changes.length > 0) {
            console.log('\n📝 Sample word changes:');
            for (const change of reconstructResult.changes.slice(0, 10)) {
                console.log(`  ${change.english}: ${change.old} → ${change.new}`);
                console.log(`    Pronunciation: ${change.pronunciation.old} → ${change.pronunciation.new}`);
            }
            if (reconstructResult.totalChanges > 10) {
                console.log(`  ... and ${reconstructResult.totalChanges - 10} more changes`);
            }
        }

        // Update dictionary files
        await generator.generateDictionaries(language);
        console.log('\n📚 Dictionary files updated successfully!');
        
    } catch (error) {
        console.error('❌ Failed to reconstruct language:', error.message);
        process.exit(1);
    }
}

async function handleBatchUtils(options) {
    const dictPath = path.resolve('./dictionaries');
    
    try {
        if (options.pause) {
            const pauseFile = path.join(dictPath, '.pause');
            await fs.writeFile(pauseFile, new Date().toISOString());
            console.log('✅ Pause file created. Current batch operation will pause after finishing the current word.');
        }
        
        if (options.status) {
            console.log('\n📊 Batch Processing Status:\n');
            
            // Check for pause file
            try {
                await fs.access(path.join(dictPath, '.pause'));
                console.log('⏸️  Pause file detected - operations will pause');
            } catch {
                console.log('▶️  No pause file - operations running normally');
            }
            
            // Check for progress files
            const files = await fs.readdir(dictPath);
            const progressFiles = files.filter(f => f.endsWith('_batch_progress.json'));
            
            if (progressFiles.length === 0) {
                console.log('📂 No active batch operations found\n');
            } else {
                console.log('📂 Active batch operations:\n');
                for (const file of progressFiles) {
                    try {
                        const progressData = JSON.parse(await fs.readFile(path.join(dictPath, file), 'utf-8'));
                        const languageName = file.replace('_batch_progress.json', '');
                        console.log(`   ${languageName}:`);
                        console.log(`     Progress: ${progressData.currentIndex}/${progressData.totalWords} words`);
                        console.log(`     Processed: ${progressData.processedWords?.length || 0} words`);
                        console.log(`     Last update: ${new Date(progressData.timestamp).toLocaleString()}`);
                        console.log();
                    } catch (error) {
                        console.warn(`     Could not read ${file}: ${error.message}`);
                    }
                }
            }
        }
        
        if (options.clean) {
            const files = await fs.readdir(dictPath);
            const progressFiles = files.filter(f => f.endsWith('_batch_progress.json'));
            const pauseFile = path.join(dictPath, '.pause');
            
            let cleaned = 0;
            
            // Remove progress files
            for (const file of progressFiles) {
                await fs.unlink(path.join(dictPath, file));
                cleaned++;
            }
            
            // Remove pause file if it exists
            try {
                await fs.unlink(pauseFile);
                cleaned++;
            } catch {
                // Pause file doesn't exist
            }
            
            console.log(`✅ Cleaned up ${cleaned} batch processing files.`);
        }
        
        if (!options.pause && !options.status && !options.clean && !options.resume) {
            console.log('\n🔧 Batch Processing Utilities\n');
            console.log('Usage: sigment batch [options]\n');
            console.log('Options:');
            console.log('  --pause    Create pause file to pause current operations');
            console.log('  --status   Show status of batch operations');
            console.log('  --clean    Clean up batch progress files');
            console.log('\nExample usage:');
            console.log('  sigment batch --pause     # Pause current operation');
            console.log('  sigment batch --status    # Check operation status');
            console.log('  sigment batch --clean     # Clean up old progress files');
        }
        
    } catch (error) {
        console.error('❌ Batch utility operation failed:', error.message);
        process.exit(1);
    }
}

async function exportSigmentFile(options) {
    try {
        console.log(`\n📦 Exporting language "${options.language}" to .sigment format...\n`);

        // Convert existing dictionaries to .sigment format
        const dictDir = './dictionaries';
        const language = SigmentUtils.convertFromDictionaries(dictDir, options.language);

        // Ensure output path has .sigment extension
        let outputPath = options.output;
        if (!outputPath.endsWith('.sigment')) {
            outputPath = outputPath.replace(/\.[^.]*$/, '') + '.sigment';
        }

        // Export to .sigment file
        const parser = new SigmentParser();
        parser.exportToFile(language, outputPath);

        console.log(`✅ Language exported to .sigment format: ${outputPath}`);
        console.log(`📊 Stats: ${language.getStats().totalWords} words, v${language.version}`);
        console.log(`🔗 This file can now be used in external applications!`);

    } catch (error) {
        console.error('❌ .sigment export failed:', error.message);
        console.error('💡 Make sure the language exists and dictionaries are available');
    }
}

async function importSigmentFile(options) {
    try {
        console.log(`\n📥 Importing .sigment file: ${options.file}\n`);

        // Parse the .sigment file
        const parser = new SigmentParser();
        const language = parser.parseFile(options.file);

        console.log(`✅ Loaded language: ${language.name}`);
        console.log(`📊 Stats:`, language.getStats());

        // Convert to traditional dictionary format for compatibility
        const dictDir = './dictionaries';
        await fs.mkdir(dictDir, { recursive: true });

        // Write traditional format dictionaries
        const baseName = language.name;

        await fs.writeFile(
            path.join(dictDir, `${baseName}_to_English.json`),
            JSON.stringify(language.toEnglish, null, 2)
        );

        await fs.writeFile(
            path.join(dictDir, `English_to_${baseName}.json`),
            JSON.stringify(language.toSigment, null, 2)
        );

        if (Object.keys(language.sigmentDefinitions).length > 0) {
            await fs.writeFile(
                path.join(dictDir, `${baseName}_to_${baseName}.json`),
                JSON.stringify(language.sigmentDefinitions, null, 2)
            );
        }

        // Write metadata
        const metadata = {
            name: language.name,
            version: language.version,
            style: language.style,
            created: language.created,
            imported: new Date().toISOString(),
            source: options.file,
            ...language.metadata
        };

        await fs.writeFile(
            path.join(dictDir, `${baseName}_metadata.json`),
            JSON.stringify(metadata, null, 2)
        );

        console.log(`✅ Language "${language.name}" imported successfully`);
        console.log(`📁 Dictionary files created in: ${dictDir}`);

    } catch (error) {
        console.error('❌ .sigment import failed:', error.message);
        console.error('💡 Ensure the .sigment file is valid and readable');
    }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/')) ||
    process.argv[1].endsWith('cli.js')) {
    program.parse();
}