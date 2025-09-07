#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import { LanguageGenerator } from './language-generator.js';
import fs from 'fs/promises';
import path from 'path';

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
    .option('--no-ollama', 'Disable Ollama integration')
    .option('--ollama-url <url>', 'Ollama server URL', 'http://localhost:11434')
    .option('--ollama-model <model>', 'Ollama model to use', 'llama3.2')
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
    .command('import')
    .description('Import language data')
    .requiredOption('-f, --file <path>', 'Input file path')
    .action(async (options) => {
        await importLanguage(options);
    });

async function runInteractiveMode() {
    console.log('\n🍅 Sigment Language Constructor - Interactive Mode\n');

    const mainAction = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                'Generate a new language',
                'Translate words',
                'View existing languages',
                'Import/Export languages',
                'Exit'
            ]
        }
    ]);

    switch (mainAction.action) {
        case 'Generate a new language':
            await interactiveGeneration();
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
        case 'Exit':
            console.log('Goodbye!');
            process.exit(0);
    }

    const continuePrompt = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'continue',
            message: 'Would you like to do something else?',
            default: true
        }
    ]);

    if (continuePrompt.continue) {
        await runInteractiveMode();
    }
}

async function interactiveGeneration() {
    console.log('\n📚 Language Generation Setup\n');

    const config = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Language name:',
            validate: input => input.trim() ? true : 'Language name is required'
        },
        {
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
        },
        {
            type: 'list',
            name: 'vocabularySource',
            message: 'Vocabulary source:',
            choices: [
                { name: 'Common English words (automatic)', value: 'common' },
                { name: 'Custom word list (manual entry)', value: 'manual' },
                { name: 'Load from file', value: 'file' }
            ]
        }
    ]);

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
        const fileInput = await inquirer.prompt([
            {
                type: 'input',
                name: 'filePath',
                message: 'Path to word list file:'
            }
        ]);
        vocabulary = `file:${fileInput.filePath}`;
    }

    const advancedOptions = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'useCustomPrompt',
            message: 'Use custom generation prompt?',
            default: false
        },
        {
            type: 'confirm',
            name: 'useOllama',
            message: 'Use Ollama for enhanced etymological analysis?',
            default: true
        }
    ]);

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
        const ollamaDetails = await inquirer.prompt([
            {
                type: 'input',
                name: 'url',
                message: 'Ollama server URL:',
                default: 'http://localhost:11434'
            },
            {
                type: 'input',
                name: 'model',
                message: 'Ollama model:',
                default: 'llama3.2'
            }
        ]);
        ollamaConfig.ollamaUrl = ollamaDetails.url;
        ollamaConfig.ollamaModel = ollamaDetails.model;
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
            etymologicalDepth: 'high'
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

        const viewSample = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'view',
                message: 'View a sample of generated words?',
                default: true
            }
        ]);

        if (viewSample.view) {
            displaySampleWords(result.language);
        }

    } catch (error) {
        console.error('❌ Language generation failed:', error.message);
    }
}

async function interactiveTranslation() {
    const generator = new LanguageGenerator();
    const languages = generator.getAvailableLanguages();

    if (languages.length === 0) {
        console.log('\n❌ No languages available. Generate a language first.\n');
        return;
    }

    const translationConfig = await inquirer.prompt([
        {
            type: 'list',
            name: 'language',
            message: 'Select language:',
            choices: languages
        },
        {
            type: 'list',
            name: 'direction',
            message: 'Translation direction:',
            choices: [
                { name: 'English → Sigment', value: 'to-sigment' },
                { name: 'Sigment → English', value: 'to-english' },
                { name: 'Sigment definition', value: 'sigment-def' }
            ]
        },
        {
            type: 'input',
            name: 'word',
            message: 'Word to translate:',
            validate: input => input.trim() ? true : 'Word is required'
        }
    ]);

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
    const languages = generator.getAvailableLanguages();

    if (languages.length === 0) {
        console.log('\n❌ No languages available.\n');
        return;
    }

    const selection = await inquirer.prompt([
        {
            type: 'list',
            name: 'language',
            message: 'Select language to view:',
            choices: languages
        }
    ]);

    await showLanguageInfo({ language: selection.language });
}

async function interactiveImportExport() {
    const action = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Import or Export?',
            choices: ['Export language', 'Import language']
        }
    ]);

    if (action.action === 'Export language') {
        const generator = new LanguageGenerator();
        const languages = generator.getAvailableLanguages();

        if (languages.length === 0) {
            console.log('\n❌ No languages available to export.\n');
            return;
        }

        const exportConfig = await inquirer.prompt([
            {
                type: 'list',
                name: 'language',
                message: 'Select language to export:',
                choices: languages
            },
            {
                type: 'input',
                name: 'output',
                message: 'Output file path:',
                default: (answers) => `./${answers.language}_export.json`
            }
        ]);

        await exportLanguage(exportConfig);
    } else {
        const importConfig = await inquirer.prompt([
            {
                type: 'input',
                name: 'file',
                message: 'Path to language file:',
                validate: input => input.trim() ? true : 'File path is required'
            }
        ]);

        await importLanguage(importConfig);
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
            etymologicalDepth: 'medium'
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

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || 
    import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/')) ||
    process.argv[1].endsWith('cli.js')) {
    program.parse();
}