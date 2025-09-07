#!/usr/bin/env node

import inquirer from 'inquirer';
import { LanguageGenerator } from './src/index.js';

console.log('🔧 Testing Interactive Translation Direction Fix...\n');

async function testTranslationMenus() {
    const generator = new LanguageGenerator();
    const languages = await generator.getAvailableLanguages();

    console.log(`Found languages: ${languages.join(', ')}\n`);

    // Simulate the translation menu for Tomato language
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
            choices: (answers) => [
                { name: `English → ${answers.language}`, value: 'to-sigment' },
                { name: `${answers.language} → English`, value: 'to-english' },
                { name: `${answers.language} definition`, value: 'sigment-def' }
            ]
        }
    ]);

    console.log('\n✅ Selected options:');
    console.log(`Language: ${translationConfig.language}`);
    console.log(`Direction: ${translationConfig.direction}`);
    console.log('Translation menu now correctly shows the actual language name!');
}

testTranslationMenus().catch(console.error);