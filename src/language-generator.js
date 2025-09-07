import { EtymologicalAnalyzer } from './etymological-analyzer.js';
import { PhoneticMapper } from './phonetic-mapper.js';
import { OllamaClient } from './ollama-client.js';
import fs from 'fs/promises';
import path from 'path';

export class LanguageGenerator {
    constructor(options = {}) {
        this.options = {
            useOllama: true,
            ollamaUrl: 'http://localhost:11434',
            ollamaModel: 'llama3.2',
            cacheEnabled: true,
            outputPath: './dictionaries',
            ...options
        };

        this.ollamaClient = null;
        this.etymologicalAnalyzer = null;
        this.phoneticMapper = null;
        this.languageDatabase = new Map();
        this.generationStats = {
            wordsProcessed: 0,
            languagesCreated: 0,
            startTime: null,
            errors: []
        };

        this.initializationPromise = this.initialize();
    }

    async initialize() {
        if (this.options.useOllama) {
            this.ollamaClient = new OllamaClient(
                this.options.ollamaUrl,
                this.options.ollamaModel
            );
            
            const connectionTest = await this.ollamaClient.testConnection();
            if (!connectionTest) {
                console.warn('Ollama connection failed. Operating in offline mode.');
                this.ollamaClient = null;
            }
        }

        this.etymologicalAnalyzer = new EtymologicalAnalyzer(this.ollamaClient);
        this.phoneticMapper = new PhoneticMapper();
    }

    async generateLanguage(config) {
        // Ensure initialization is complete
        await this.initializationPromise;
        
        this.generationStats.startTime = Date.now();
        
        const languageConfig = {
            name: config.name || 'CustomSigment',
            style: config.style || 'default',
            vocabulary: config.vocabulary || [],
            phoneticRules: config.phoneticRules || {},
            etymologicalDepth: config.etymologicalDepth || 'medium',
            customPrompt: config.customPrompt || '',
            ...config
        };

        console.log(`Generating language: ${languageConfig.name}`);
        
        const language = {
            config: languageConfig,
            vocabulary: new Map(),
            phoneticSystem: {},
            etymologicalMaps: new Map(),
            metadata: {
                created: new Date().toISOString(),
                version: '1.0.0',
                generator: 'Sigment Language Constructor'
            }
        };

        if (languageConfig.customPrompt) {
            await this.applyCustomPromptLogic(language, languageConfig.customPrompt);
        }

        await this.buildVocabulary(language, languageConfig.vocabulary);
        await this.establishPhoneticSystem(language);
        
        this.languageDatabase.set(languageConfig.name, language);
        
        await this.generateDictionaries(language);
        
        this.generationStats.languagesCreated++;
        
        return {
            language,
            dictionaries: this.getDictionaryPaths(languageConfig.name),
            stats: this.getGenerationStats()
        };
    }

    async applyCustomPromptLogic(language, customPrompt) {
        if (this.ollamaClient) {
            try {
                const analysisPrompt = `
                Analyze this custom language generation request and provide linguistic guidance:
                "${customPrompt}"
                
                Provide recommendations for:
                1. Phonetic transformation rules
                2. Morphological patterns
                3. Semantic organization principles
                4. Cultural/thematic influences
                
                Format as:
                PHONETICS: [transformation rules]
                MORPHOLOGY: [structural patterns]
                SEMANTICS: [meaning organization]
                CULTURE: [thematic elements]
                `;

                const response = await this.ollamaClient.makeRequest(analysisPrompt);
                const guidance = this.parseCustomPromptGuidance(response);
                
                this.applyPromptGuidance(language, guidance);
            } catch (error) {
                console.warn('Custom prompt analysis failed:', error.message);
            }
        }
    }

    parseCustomPromptGuidance(response) {
        const guidance = {
            phonetics: [],
            morphology: [],
            semantics: [],
            culture: []
        };

        const lines = response.split('\n');
        let currentSection = null;

        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex !== -1) {
                const key = line.substring(0, colonIndex).trim().toUpperCase();
                const value = line.substring(colonIndex + 1).trim();

                switch (key) {
                    case 'PHONETICS':
                        currentSection = 'phonetics';
                        if (value) guidance.phonetics.push(value);
                        break;
                    case 'MORPHOLOGY':
                        currentSection = 'morphology';
                        if (value) guidance.morphology.push(value);
                        break;
                    case 'SEMANTICS':
                        currentSection = 'semantics';
                        if (value) guidance.semantics.push(value);
                        break;
                    case 'CULTURE':
                        currentSection = 'culture';
                        if (value) guidance.culture.push(value);
                        break;
                    default:
                        if (currentSection && line.trim()) {
                            guidance[currentSection].push(line.trim());
                        }
                }
            } else if (currentSection && line.trim()) {
                guidance[currentSection].push(line.trim());
            }
        }

        return guidance;
    }

    applyPromptGuidance(language, guidance) {
        if (guidance.phonetics.length > 0) {
            language.config.phoneticGuidance = guidance.phonetics;
            this.phoneticMapper = new PhoneticMapper({
                customRules: this.convertPhoneticGuidanceToRules(guidance.phonetics)
            });
        }

        if (guidance.culture.length > 0) {
            language.config.culturalThemes = guidance.culture;
        }

        language.config.appliedGuidance = guidance;
    }

    convertPhoneticGuidanceToRules(guidance) {
        const rules = {};
        for (const guide of guidance) {
            if (guide.includes('->') || guide.includes('→')) {
                const parts = guide.split(/->|→/).map(p => p.trim());
                if (parts.length === 2) {
                    rules[parts[0]] = parts[1];
                }
            }
        }
        return rules;
    }

    async buildVocabulary(language, vocabularyInput) {
        let wordList = [];

        if (Array.isArray(vocabularyInput)) {
            wordList = vocabularyInput;
        } else if (typeof vocabularyInput === 'string') {
            if (vocabularyInput.startsWith('file:')) {
                const filePath = vocabularyInput.substring(5);
                wordList = await this.loadWordListFromFile(filePath);
            } else {
                wordList = vocabularyInput.split(/[,\s\n]+/).filter(w => w.trim());
            }
        }

        if (wordList.length === 0) {
            wordList = await this.getCommonEnglishWords();
        }

        console.log(`Building vocabulary for ${wordList.length} words...`);

        for (const word of wordList) {
            if (word && word.trim()) {
                await this.processWord(language, word.trim());
            }
        }
    }

    async processWord(language, englishWord) {
        try {
            const etymology = await this.etymologicalAnalyzer.analyzeWord(englishWord);
            
            const sigmentMapping = this.phoneticMapper.mapWordToSigment(
                englishWord,
                etymology,
                language.config.style,
                { asciiPronunciation: language.config.asciiPronunciation || false }
            );

            let definitions = { primary: [`Definition of ${englishWord}`] };
            if (this.ollamaClient) {
                definitions = await this.ollamaClient.getDefinitions(englishWord);
            }

            const vocabularyEntry = {
                english: englishWord,
                sigment: sigmentMapping.sigment,
                pronunciation: sigmentMapping.pronunciation,
                definitions,
                etymology,
                phoneticStructure: sigmentMapping.phoneticStructure,
                transformationRules: sigmentMapping.transformationRules,
                partOfSpeech: this.determinePartOfSpeech(englishWord, etymology, definitions),
                frequency: this.calculateWordFrequency(englishWord),
                created: new Date().toISOString()
            };

            language.vocabulary.set(englishWord, vocabularyEntry);
            language.etymologicalMaps.set(sigmentMapping.sigment, vocabularyEntry);
            
            this.generationStats.wordsProcessed++;
            
            if (this.generationStats.wordsProcessed % 100 === 0) {
                console.log(`Processed ${this.generationStats.wordsProcessed} words...`);
            }

        } catch (error) {
            this.generationStats.errors.push({
                word: englishWord,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            console.warn(`Error processing word "${englishWord}":`, error.message);
        }
    }

    async establishPhoneticSystem(language) {
        const phoneticSystem = {
            vowelInventory: new Set(),
            consonantInventory: new Set(),
            phoneticPatterns: new Map(),
            syllableStructures: new Map(),
            stressPatterns: new Set()
        };

        for (const [, entry] of language.vocabulary) {
            const structure = entry.phoneticStructure;
            
            phoneticSystem.phoneticPatterns.set(
                structure.pattern,
                (phoneticSystem.phoneticPatterns.get(structure.pattern) || 0) + 1
            );
            
            phoneticSystem.syllableStructures.set(
                structure.syllableCount,
                (phoneticSystem.syllableStructures.get(structure.syllableCount) || 0) + 1
            );

            for (const char of entry.sigment.toLowerCase()) {
                if ('aeiou'.includes(char)) {
                    phoneticSystem.vowelInventory.add(char);
                } else if (/[a-z]/.test(char)) {
                    phoneticSystem.consonantInventory.add(char);
                }
            }
        }

        language.phoneticSystem = phoneticSystem;
    }

    async generateDictionaries(language) {
        const outputDir = path.resolve(this.options.outputPath);
        await fs.mkdir(outputDir, { recursive: true });

        const languageName = language.config.name;
        
        const sigmentToEnglishDict = this.createSigmentToEnglishDictionary(language);
        const sigmentToSigmentDict = this.createSigmentToSigmentDictionary(language);
        const englishToSigmentDict = this.createEnglishToSigmentDictionary(language);

        await fs.writeFile(
            path.join(outputDir, `${languageName}_to_English.json`),
            JSON.stringify(sigmentToEnglishDict, null, 2)
        );

        await fs.writeFile(
            path.join(outputDir, `${languageName}_to_${languageName}.json`),
            JSON.stringify(sigmentToSigmentDict, null, 2)
        );

        await fs.writeFile(
            path.join(outputDir, `English_to_${languageName}.json`),
            JSON.stringify(englishToSigmentDict, null, 2)
        );

        await fs.writeFile(
            path.join(outputDir, `${languageName}_metadata.json`),
            JSON.stringify({
                ...language.metadata,
                config: language.config,
                phoneticSystem: this.serializePhoneticSystem(language.phoneticSystem),
                vocabularySize: language.vocabulary.size,
                generationStats: this.generationStats
            }, null, 2)
        );
    }

    createSigmentToEnglishDictionary(language) {
        const dictionary = {};
        
        for (const [englishWord, entry] of language.vocabulary) {
            dictionary[entry.sigment] = {
                english: englishWord,
                definitions: entry.definitions.primary,
                pronunciation: entry.pronunciation,
                partOfSpeech: entry.partOfSpeech,
                etymology: {
                    origin: entry.etymology.origin || 'unknown',
                    development: entry.etymology.development || ''
                }
            };
        }

        return {
            metadata: {
                type: 'Sigment to English Dictionary',
                language: language.config.name,
                entries: Object.keys(dictionary).length,
                created: new Date().toISOString()
            },
            dictionary
        };
    }

    createSigmentToSigmentDictionary(language) {
        const dictionary = {};
        
        for (const [, entry] of language.vocabulary) {
            const sigmentDefinitions = this.translateDefinitionsToSigment(
                entry.definitions.primary,
                language
            );

            dictionary[entry.sigment] = {
                definitions: sigmentDefinitions,
                pronunciation: entry.pronunciation,
                partOfSpeech: entry.partOfSpeech,
                relatedWords: this.findRelatedSigmentWords(entry, language)
            };
        }

        return {
            metadata: {
                type: 'Sigment to Sigment Dictionary',
                language: language.config.name,
                entries: Object.keys(dictionary).length,
                created: new Date().toISOString()
            },
            dictionary
        };
    }

    createEnglishToSigmentDictionary(language) {
        const dictionary = {};
        
        for (const [englishWord, entry] of language.vocabulary) {
            dictionary[englishWord] = {
                sigment: entry.sigment,
                pronunciation: entry.pronunciation,
                definitions: entry.definitions.primary,
                partOfSpeech: entry.partOfSpeech,
                phoneticStructure: entry.phoneticStructure
            };
        }

        return {
            metadata: {
                type: 'English to Sigment Dictionary',
                language: language.config.name,
                entries: Object.keys(dictionary).length,
                created: new Date().toISOString()
            },
            dictionary
        };
    }

    translateDefinitionsToSigment(englishDefinitions, language) {
        const sigmentDefinitions = [];
        
        for (const definition of englishDefinitions) {
            let sigmentDefinition = definition;
            
            for (const [englishWord, entry] of language.vocabulary) {
                const regex = new RegExp(`\\b${englishWord}\\b`, 'gi');
                sigmentDefinition = sigmentDefinition.replace(regex, entry.sigment);
            }
            
            sigmentDefinitions.push(sigmentDefinition);
        }

        return sigmentDefinitions;
    }

    findRelatedSigmentWords(targetEntry, language) {
        const related = [];
        
        for (const [, entry] of language.vocabulary) {
            if (entry === targetEntry) continue;
            
            if (this.areEtymologicallyRelated(targetEntry.etymology, entry.etymology)) {
                related.push(entry.sigment);
            }
        }

        return related.slice(0, 5);
    }

    areEtymologicallyRelated(etymology1, etymology2) {
        if (etymology1.origin === etymology2.origin && etymology1.origin !== 'unknown') {
            return true;
        }
        
        if (etymology1.root && etymology2.root && 
            (etymology1.root.includes(etymology2.root) || 
            etymology2.root.includes(etymology1.root))) {
            return true;
        }

        return false;
    }

    async loadWordListFromFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return content.split(/\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
        } catch (error) {
            console.warn(`Failed to load word list from ${filePath}:`, error.message);
            return [];
        }
    }

    async getCommonEnglishWords() {
        return [
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
            'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
            'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
            'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
            'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
            'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
            'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
            'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
            'most', 'us', 'is', 'water', 'long', 'very', 'after', 'word', 'great', 'where',
            'through', 'much', 'before', 'line', 'right', 'too', 'means', 'old', 'any', 'same',
            'tell', 'boy', 'follow', 'came', 'want', 'show', 'also', 'around', 'form', 'three',
            'small', 'set', 'put', 'end', 'why', 'again', 'turn', 'here', 'off', 'went',
            'old', 'number', 'great', 'tell', 'men', 'say', 'small', 'every', 'found', 'still',
            'between', 'name', 'should', 'home', 'big', 'give', 'air', 'line', 'set', 'own'
        ];
    }

    determinePartOfSpeech(word, etymology, definitions) {
        const morphemes = etymology.morphemes || [];
        const suffixMorphemes = morphemes.filter(m => m.type === 'suffix');
        
        if (suffixMorphemes.length > 0) {
            const suffix = suffixMorphemes[0].value;
            const posMap = {
                '-ing': 'verb/noun',
                '-ed': 'verb',
                '-er': 'noun',
                '-est': 'adjective',
                '-ly': 'adverb',
                '-tion': 'noun',
                '-ness': 'noun',
                '-ful': 'adjective',
                '-less': 'adjective'
            };
            
            if (posMap[suffix]) return posMap[suffix];
        }

        if (definitions.partOfSpeech && Array.isArray(definitions.partOfSpeech) && definitions.partOfSpeech.length > 0) {
            return definitions.partOfSpeech.join('/');
        }

        return 'unknown';
    }

    calculateWordFrequency(word) {
        const commonWords = new Set([
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at'
        ]);

        if (commonWords.has(word.toLowerCase())) return 'high';
        if (word.length <= 4) return 'medium';
        return 'low';
    }

    serializePhoneticSystem(phoneticSystem) {
        return {
            vowelInventory: Array.from(phoneticSystem.vowelInventory),
            consonantInventory: Array.from(phoneticSystem.consonantInventory),
            phoneticPatterns: Object.fromEntries(phoneticSystem.phoneticPatterns),
            syllableStructures: Object.fromEntries(phoneticSystem.syllableStructures),
            stressPatterns: Array.from(phoneticSystem.stressPatterns)
        };
    }

    getDictionaryPaths(languageName) {
        const outputDir = path.resolve(this.options.outputPath);
        return {
            sigmentToEnglish: path.join(outputDir, `${languageName}_to_English.json`),
            sigmentToSigment: path.join(outputDir, `${languageName}_to_${languageName}.json`),
            englishToSigment: path.join(outputDir, `English_to_${languageName}.json`),
            metadata: path.join(outputDir, `${languageName}_metadata.json`)
        };
    }

    getGenerationStats() {
        return {
            ...this.generationStats,
            elapsedTime: this.generationStats.startTime ? 
                Date.now() - this.generationStats.startTime : 0
        };
    }

    async saveLanguageData(languageName, filePath) {
        let language = this.languageDatabase.get(languageName);
        
        // If not in memory, try to load from filesystem
        if (!language) {
            language = await this.loadFullLanguageData(languageName);
            if (!language) {
                throw new Error(`Language "${languageName}" not found`);
            }
        }

        const exportData = {
            config: language.config,
            vocabulary: Object.fromEntries(language.vocabulary),
            phoneticSystem: this.serializePhoneticSystem(language.phoneticSystem),
            metadata: language.metadata,
            stats: this.getGenerationStats()
        };

        await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
        return filePath;
    }

    async loadLanguageData(filePath) {
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        
        const language = {
            config: data.config,
            vocabulary: new Map(Object.entries(data.vocabulary)),
            phoneticSystem: this.deserializePhoneticSystem(data.phoneticSystem),
            etymologicalMaps: new Map(),
            metadata: data.metadata
        };

        for (const [, entry] of language.vocabulary) {
            language.etymologicalMaps.set(entry.sigment, entry);
        }

        this.languageDatabase.set(data.config.name, language);
        return language;
    }

    deserializePhoneticSystem(serialized) {
        return {
            vowelInventory: new Set(serialized.vowelInventory || []),
            consonantInventory: new Set(serialized.consonantInventory || []),
            phoneticPatterns: new Map(Object.entries(serialized.phoneticPatterns || {})),
            syllableStructures: new Map(Object.entries(serialized.syllableStructures || {})),
            stressPatterns: new Set(serialized.stressPatterns || [])
        };
    }

    async getAvailableLanguages() {
        const filesystemLanguages = await this.loadLanguagesFromFilesystem();
        const memoryLanguages = Array.from(this.languageDatabase.keys());
        
        const allLanguages = [...new Set([...filesystemLanguages, ...memoryLanguages])];
        return allLanguages;
    }

    async loadLanguagesFromFilesystem() {
        try {
            const outputDir = path.resolve(this.options.outputPath);
            const files = await fs.readdir(outputDir);
            const metadataFiles = files.filter(f => f.endsWith('_metadata.json'));
            
            return metadataFiles.map(file => {
                const languageName = file.replace('_metadata.json', '');
                return languageName;
            });
        } catch (error) {
            console.warn('Failed to load languages from filesystem:', error.message);
            return [];
        }
    }

    async getLanguage(name) {
        // First check if language is in memory
        if (this.languageDatabase.has(name)) {
            return this.languageDatabase.get(name);
        }
        
        // Try to load from filesystem
        try {
            const metadataPath = path.resolve(this.options.outputPath, `${name}_metadata.json`);
            const metadataExists = await fs.access(metadataPath).then(() => true).catch(() => false);
            
            if (metadataExists) {
                // Load the basic metadata for display
                const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
                return {
                    config: metadata.config || { name, style: 'unknown' },
                    metadata: metadata,
                    vocabularySize: metadata.vocabularySize || 0
                };
            }
        } catch (error) {
            console.warn(`Failed to load language "${name}":`, error.message);
        }
        
        return null;
    }

    async addWordsToLanguage(languageName, newWords, options = {}) {
        try {
            // Ensure initialization is complete
            await this.initializationPromise;
            
            console.log(`Adding ${newWords.length} words to language: ${languageName}`);
            
            // Load the existing language
            const existingLanguage = await this.loadFullLanguageData(languageName);
            if (!existingLanguage) {
                throw new Error(`Language "${languageName}" not found`);
            }

            // Override ASCII pronunciation setting if specified
            if (options.asciiPronunciation !== undefined) {
                existingLanguage.config.asciiPronunciation = options.asciiPronunciation;
            }

            // Process new words
            let addedCount = 0;
            for (const word of newWords) {
                const cleanWord = word.trim();
                if (cleanWord && !existingLanguage.vocabulary.has(cleanWord)) {
                    await this.processWord(existingLanguage, cleanWord);
                    addedCount++;
                } else if (existingLanguage.vocabulary.has(cleanWord)) {
                    console.warn(`Word "${cleanWord}" already exists in ${languageName}, skipping`);
                }
            }

            if (addedCount === 0) {
                console.log('No new words to add');
                return {
                    language: existingLanguage,
                    addedCount: 0,
                    skippedCount: newWords.length,
                    dictionaries: this.getDictionaryPaths(languageName)
                };
            }

            // Update metadata
            existingLanguage.metadata.lastModified = new Date().toISOString();
            existingLanguage.metadata.version = this.incrementVersion(existingLanguage.metadata.version);

            // Regenerate dictionaries with new words
            await this.generateDictionaries(existingLanguage);

            console.log(`✅ Added ${addedCount} new words to ${languageName}`);
            
            // Analyze if dictionary reconstruction would be beneficial
            const reconstructionAnalysis = await this.shouldReconstructDictionary(existingLanguage, addedCount);
            
            return {
                language: existingLanguage,
                addedCount,
                skippedCount: newWords.length - addedCount,
                dictionaries: this.getDictionaryPaths(languageName),
                reconstructionRecommendation: reconstructionAnalysis
            };

        } catch (error) {
            console.error(`Failed to add words to language "${languageName}":`, error.message);
            throw error;
        }
    }

    async loadFullLanguageData(languageName) {
        // First check if it's already in memory with full data
        if (this.languageDatabase.has(languageName)) {
            const existing = this.languageDatabase.get(languageName);
            if (existing.vocabulary && existing.vocabulary.size > 0) {
                return existing;
            }
        }

        // Load from filesystem
        try {
            const outputDir = path.resolve(this.options.outputPath);
            const metadataPath = path.join(outputDir, `${languageName}_metadata.json`);
            const englishToSigmentPath = path.join(outputDir, `English_to_${languageName}.json`);
            
            // Check if files exist
            await fs.access(metadataPath);
            await fs.access(englishToSigmentPath);

            // Load metadata
            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
            
            // Load existing vocabulary from English_to_Sigment dictionary
            const englishDict = JSON.parse(await fs.readFile(englishToSigmentPath, 'utf-8'));
            
            // Reconstruct language object
            const language = {
                config: metadata.config,
                vocabulary: new Map(),
                phoneticSystem: this.deserializePhoneticSystem(metadata.phoneticSystem || {}),
                etymologicalMaps: new Map(),
                metadata
            };

            // Reconstruct vocabulary from dictionary
            for (const [englishWord, entry] of Object.entries(englishDict.dictionary || {})) {
                const vocabularyEntry = {
                    english: englishWord,
                    sigment: entry.sigment,
                    pronunciation: entry.pronunciation,
                    definitions: { primary: entry.definitions || [] },
                    etymology: { morphemes: [], origin: 'reconstructed', root: englishWord },
                    phoneticStructure: entry.phoneticStructure || {},
                    transformationRules: [],
                    partOfSpeech: entry.partOfSpeech || 'unknown',
                    frequency: 'unknown',
                    created: metadata.created || new Date().toISOString()
                };

                language.vocabulary.set(englishWord, vocabularyEntry);
                language.etymologicalMaps.set(entry.sigment, vocabularyEntry);
            }

            // Store in memory
            this.languageDatabase.set(languageName, language);
            
            console.log(`Loaded ${language.vocabulary.size} existing words from ${languageName}`);
            return language;

        } catch (error) {
            console.error(`Failed to load language data for "${languageName}":`, error.message);
            return null;
        }
    }

    incrementVersion(currentVersion) {
        if (!currentVersion || currentVersion === '1.0.0') {
            return '1.0.1';
        }
        
        const parts = currentVersion.split('.');
        const patch = parseInt(parts[2] || 0) + 1;
        return `${parts[0]}.${parts[1]}.${patch}`;
    }

    async archiveLanguage(languageName) {
        try {
            const languages = await this.getAvailableLanguages();
            if (!languages.includes(languageName)) {
                throw new Error(`Language "${languageName}" does not exist`);
            }

            const archiveDir = path.join(this.options.outputPath, 'archived');
            await fs.mkdir(archiveDir, { recursive: true });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const archiveSubDir = path.join(archiveDir, `${languageName}_${timestamp}`);
            await fs.mkdir(archiveSubDir, { recursive: true });

            const filesToArchive = [
                `${languageName}_to_English.json`,
                `${languageName}_to_${languageName}.json`,
                `English_to_${languageName}.json`,
                `${languageName}_metadata.json`
            ];

            let archivedFiles = 0;
            for (const fileName of filesToArchive) {
                const sourcePath = path.join(this.options.outputPath, fileName);
                const destPath = path.join(archiveSubDir, fileName);
                
                try {
                    await fs.access(sourcePath);
                    await fs.copyFile(sourcePath, destPath);
                    await fs.unlink(sourcePath);
                    archivedFiles++;
                } catch (error) {
                    console.warn(`Could not archive ${fileName}: ${error.message}`);
                }
            }

            if (this.languageDatabase.has(languageName)) {
                this.languageDatabase.delete(languageName);
            }

            return {
                success: true,
                archivedFiles,
                archivePath: archiveSubDir,
                timestamp
            };

        } catch (error) {
            console.error(`Failed to archive language "${languageName}":`, error.message);
            throw error;
        }
    }

    async getArchivedLanguages() {
        try {
            const archiveDir = path.join(this.options.outputPath, 'archived');
            
            try {
                await fs.access(archiveDir);
            } catch {
                return [];
            }

            const entries = await fs.readdir(archiveDir, { withFileTypes: true });
            const archived = [];

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const parts = entry.name.split('_');
                    if (parts.length >= 2) {
                        const timestamp = parts.slice(-1)[0];
                        const languageName = parts.slice(0, -1).join('_');
                        
                        const metadataPath = path.join(archiveDir, entry.name, `${languageName}_metadata.json`);
                        let metadata = null;
                        
                        try {
                            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
                            metadata = JSON.parse(metadataContent);
                        } catch {
                            metadata = { name: languageName };
                        }

                        archived.push({
                            name: languageName,
                            archiveName: entry.name,
                            timestamp,
                            archivedDate: new Date(timestamp.replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d+)Z/, '$1-$2-$3T$4:$5:$6.$7Z')),
                            metadata
                        });
                    }
                }
            }

            return archived.sort((a, b) => b.archivedDate - a.archivedDate);

        } catch (error) {
            console.warn('Failed to get archived languages:', error.message);
            return [];
        }
    }

    async restoreLanguage(archiveName) {
        try {
            const archiveDir = path.join(this.options.outputPath, 'archived');
            const archivePath = path.join(archiveDir, archiveName);

            await fs.access(archivePath);

            const parts = archiveName.split('_');
            const languageName = parts.slice(0, -1).join('_');

            const existingLanguages = await this.getAvailableLanguages();
            if (existingLanguages.includes(languageName)) {
                throw new Error(`Language "${languageName}" already exists. Archive it first or choose a different name.`);
            }

            const entries = await fs.readdir(archivePath);
            const jsonFiles = entries.filter(file => file.endsWith('.json'));

            let restoredFiles = 0;
            for (const fileName of jsonFiles) {
                const sourcePath = path.join(archivePath, fileName);
                const destPath = path.join(this.options.outputPath, fileName);
                
                await fs.copyFile(sourcePath, destPath);
                restoredFiles++;
            }

            return {
                success: true,
                languageName,
                restoredFiles,
                archiveName
            };

        } catch (error) {
            console.error(`Failed to restore language from "${archiveName}":`, error.message);
            throw error;
        }
    }

    async analyzePhoneticPatterns(language) {
        const patterns = {
            vowelTransformations: new Map(),
            consonantShifts: new Map(),
            morphemeRules: new Map(),
            lengthPatterns: new Map(),
            consistencyScore: 0
        };

        const vocabularyEntries = Array.from(language.vocabulary.entries());
        
        for (const [english, entry] of vocabularyEntries) {
            // Analyze vowel transformations
            for (let i = 0; i < english.length; i++) {
                const englishChar = english[i].toLowerCase();
                const sigmentChar = entry.sigment[i]?.toLowerCase() || '';
                
                if ('aeiou'.includes(englishChar)) {
                    const key = englishChar;
                    if (!patterns.vowelTransformations.has(key)) {
                        patterns.vowelTransformations.set(key, new Map());
                    }
                    const transforms = patterns.vowelTransformations.get(key);
                    transforms.set(sigmentChar, (transforms.get(sigmentChar) || 0) + 1);
                }
                
                if ('bcdfghjklmnpqrstvwxyz'.includes(englishChar)) {
                    const key = englishChar;
                    if (!patterns.consonantShifts.has(key)) {
                        patterns.consonantShifts.set(key, new Map());
                    }
                    const transforms = patterns.consonantShifts.get(key);
                    transforms.set(sigmentChar, (transforms.get(sigmentChar) || 0) + 1);
                }
            }

            // Analyze word length patterns
            const lengthKey = english.length;
            if (!patterns.lengthPatterns.has(lengthKey)) {
                patterns.lengthPatterns.set(lengthKey, []);
            }
            patterns.lengthPatterns.get(lengthKey).push({
                english,
                sigment: entry.sigment,
                ratio: entry.sigment.length / english.length
            });
        }

        // Calculate consistency score
        patterns.consistencyScore = this.calculateConsistencyScore(patterns, vocabularyEntries.length);
        
        return patterns;
    }

    calculateConsistencyScore(patterns, totalWords) {
        let totalScore = 0;
        let factors = 0;

        // Vowel consistency
        for (const [vowel, transforms] of patterns.vowelTransformations) {
            const transformCount = Array.from(transforms.values());
            const maxCount = Math.max(...transformCount);
            const totalCount = transformCount.reduce((a, b) => a + b, 0);
            totalScore += (maxCount / totalCount) * 100;
            factors++;
        }

        // Consonant consistency  
        for (const [consonant, transforms] of patterns.consonantShifts) {
            const transformCount = Array.from(transforms.values());
            const maxCount = Math.max(...transformCount);
            const totalCount = transformCount.reduce((a, b) => a + b, 0);
            totalScore += (maxCount / totalCount) * 100;
            factors++;
        }

        return factors > 0 ? totalScore / factors : 0;
    }

    async shouldReconstructDictionary(language, newWordCount = 0) {
        const currentPatterns = await this.analyzePhoneticPatterns(language);
        
        // Reconstruction triggers
        const triggers = {
            lowConsistency: currentPatterns.consistencyScore < 70,
            significantAddition: newWordCount > language.vocabulary.size * 0.1,
            vocabularySizeThreshold: language.vocabulary.size > 50,
            patternConflicts: this.detectPatternConflicts(currentPatterns)
        };

        const recommendation = {
            shouldReconstruct: Object.values(triggers).some(Boolean),
            reasons: [],
            currentConsistency: currentPatterns.consistencyScore,
            triggers
        };

        if (triggers.lowConsistency) {
            recommendation.reasons.push(`Low phonetic consistency (${currentPatterns.consistencyScore.toFixed(1)}%)`);
        }
        if (triggers.significantAddition) {
            recommendation.reasons.push(`Significant vocabulary expansion (+${newWordCount} words)`);
        }
        if (triggers.vocabularySizeThreshold) {
            recommendation.reasons.push(`Large vocabulary size (${language.vocabulary.size} words)`);
        }
        if (triggers.patternConflicts) {
            recommendation.reasons.push('Conflicting transformation patterns detected');
        }

        return recommendation;
    }

    detectPatternConflicts(patterns) {
        let conflicts = 0;
        
        for (const [char, transforms] of patterns.vowelTransformations) {
            if (transforms.size > 3) conflicts++; // Too many different transformations
        }
        
        for (const [char, transforms] of patterns.consonantShifts) {
            if (transforms.size > 2) conflicts++; // Too many different transformations
        }
        
        return conflicts > 3;
    }

    async reconstructDictionary(language, options = {}) {
        // Ensure initialization is complete
        await this.initializationPromise;
        
        console.log(`\n🔄 Reconstructing dictionary for ${language.config.name}...`);
        
        // Backup current vocabulary
        const originalVocabulary = new Map(language.vocabulary);
        
        // Create temporary language copy for safe reconstruction
        const tempLanguage = {
            ...language,
            vocabulary: new Map() // Start with empty vocabulary for reconstruction
        };
        
        // Re-analyze patterns with full vocabulary for better rules
        const improvedPhoneticMapper = new PhoneticMapper();
        const vocabularyList = Array.from(originalVocabulary.keys());
        
        // Process all words with improved consistency
        let reconstructed = 0;
        const changes = [];
        
        for (const englishWord of vocabularyList) {
            const originalEntry = originalVocabulary.get(englishWord);
            
            // Reprocess with temporary language state and better analysis
            await this.processWord(tempLanguage, englishWord);
            const newEntry = tempLanguage.vocabulary.get(englishWord);
            
            if (newEntry && originalEntry.sigment !== newEntry.sigment) {
                changes.push({
                    english: englishWord,
                    old: originalEntry.sigment,
                    new: newEntry.sigment,
                    pronunciation: {
                        old: originalEntry.pronunciation,
                        new: newEntry.pronunciation
                    }
                });
            }
            reconstructed++;
        }

        // Calculate new consistency score
        const newPatterns = await this.analyzePhoneticPatterns(tempLanguage);
        
        // Only replace original vocabulary if reconstruction was successful
        if (reconstructed > 0) {
            language.vocabulary = tempLanguage.vocabulary;
        }
        
        return {
            success: true,
            reconstructedWords: reconstructed,
            changedWords: changes.length,
            changes: changes.slice(0, 20), // Show first 20 changes
            totalChanges: changes.length,
            consistencyImprovement: {
                before: options.beforeConsistency || 0,
                after: newPatterns.consistencyScore,
                improvement: newPatterns.consistencyScore - (options.beforeConsistency || 0)
            }
        };
    }
}