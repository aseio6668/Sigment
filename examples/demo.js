#!/usr/bin/env node

import { LanguageGenerator } from '../src/index.js';

console.log('🍅 Sigment Language Constructor - Demo\n');

async function demonstrateLanguageStyles() {
    const generator = new LanguageGenerator({
        useOllama: false,
        outputPath: './dictionaries'
    });

    const testWords = ['hello', 'world', 'computer', 'language', 'beautiful', 'fantastic', 'morning'];
    
    const styles = [
        { name: 'Default', style: 'default' },
        { name: 'Consonant Shift', style: 'consonant_shift' },
        { name: 'Vowel Harmony', style: 'vowel_harmony' },
        { name: 'Morpheme Emphasis', style: 'morpheme_emphasis' },
        { name: 'Phonetic Logic', style: 'phonetic_logic' }
    ];

    console.log('🔄 Generating languages with different styles...\n');

    for (const styleConfig of styles) {
        console.log(`\n=== ${styleConfig.name} Style ===`);
        
        try {
            const result = await generator.generateLanguage({
                name: `Demo_${styleConfig.style}`,
                style: styleConfig.style,
                vocabulary: testWords,
                etymologicalDepth: 'basic'
            });

            console.log(`✅ Generated ${result.stats.wordsProcessed} words in ${Math.round(result.stats.elapsedTime / 1000)}s`);
            
            console.log('\n📝 Sample transformations:');
            let count = 0;
            for (const [english, entry] of result.language.vocabulary) {
                if (count >= 5) break;
                console.log(`  ${english.padEnd(12)} → ${entry.sigment.padEnd(15)} ${entry.pronunciation}`);
                count++;
            }

        } catch (error) {
            console.error(`❌ Failed to generate ${styleConfig.name}: ${error.message}`);
        }
    }

    console.log('\n🎯 Style Comparison Summary:');
    console.log('• Default: Balanced approach with subtle changes');
    console.log('• Consonant Shift: Systematic consonant transformations (p↔b, t↔d, k↔g)');
    console.log('• Vowel Harmony: Vowels harmonize within words');
    console.log('• Morpheme Emphasis: Root morphemes are emphasized');
    console.log('• Phonetic Logic: Maintains strict phonetic patterns');

    console.log('\n📚 All generated dictionaries are available in ./dictionaries/');
}

async function demonstrateTranslation() {
    console.log('\n\n🔄 Translation Demo...\n');

    try {
        const generator = new LanguageGenerator({
            useOllama: false,
            outputPath: './dictionaries'
        });

        const result = await generator.generateLanguage({
            name: 'TranslationDemo',
            style: 'consonant_shift',
            vocabulary: ['hello', 'world', 'friend', 'language', 'peace', 'love', 'harmony'],
            etymologicalDepth: 'basic'
        });

        console.log('✅ Translation language generated!\n');
        console.log('📖 Translation examples:');
        
        for (const [english, entry] of result.language.vocabulary) {
            console.log(`English: ${english.padEnd(12)} → Sigment: ${entry.sigment.padEnd(15)} (${entry.pronunciation})`);
        }

        console.log('\n💡 Usage:');
        console.log('  node src/cli.js translate --language TranslationDemo --word hello --direction to-sigment');
        console.log('  node src/cli.js translate --language TranslationDemo --word hollo --direction to-english');

    } catch (error) {
        console.error('❌ Translation demo failed:', error.message);
    }
}

async function main() {
    await demonstrateLanguageStyles();
    await demonstrateTranslation();
    
    console.log('\n🎉 Demo complete!');
    console.log('\nNext steps:');
    console.log('1. Try: node src/cli.js interactive');
    console.log('2. Generate with Ollama: node src/cli.js generate --name MyLang --prompt "Create a mystical language"');
    console.log('3. Use custom vocabulary: node src/cli.js generate --name TechLang --vocabulary "algorithm,database,network"');
    console.log('\nFor more options: node src/cli.js --help\n');
}

main().catch(console.error);