import axios from 'axios';

export class OllamaClient {
    constructor(baseUrl = 'http://localhost:11434', model = 'llama3.2') {
        this.baseUrl = baseUrl;
        this.model = model;
        this.cache = new Map();
        this.maxCacheSize = 1000;
    }

    async testConnection() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/tags`);
            return response.status === 200;
        } catch (error) {
            console.warn('Ollama connection failed:', error.message);
            return false;
        }
    }

    async getEtymology(word) {
        const cacheKey = `etymology:${word}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const prompt = this.buildEtymologyPrompt(word);
        
        try {
            const response = await this.makeRequest(prompt);
            const etymology = this.parseEtymologyResponse(response);
            
            this.cacheResult(cacheKey, etymology);
            return etymology;
        } catch (error) {
            console.warn(`Failed to get etymology for "${word}":`, error.message);
            return this.getDefaultEtymology(word);
        }
    }

    async getDefinitions(word) {
        const cacheKey = `definitions:${word}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const prompt = this.buildDefinitionPrompt(word);
        
        try {
            const response = await this.makeRequest(prompt);
            const definitions = this.parseDefinitionResponse(response);
            
            this.cacheResult(cacheKey, definitions);
            return definitions;
        } catch (error) {
            console.warn(`Failed to get definitions for "${word}":`, error.message);
            return this.getDefaultDefinitions(word);
        }
    }

    async getSemanticAnalysis(word) {
        const cacheKey = `semantic:${word}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const prompt = this.buildSemanticPrompt(word);
        
        try {
            const response = await this.makeRequest(prompt);
            const analysis = this.parseSemanticResponse(response);
            
            this.cacheResult(cacheKey, analysis);
            return analysis;
        } catch (error) {
            console.warn(`Failed to get semantic analysis for "${word}":`, error.message);
            return this.getDefaultSemanticAnalysis(word);
        }
    }

    async getRelatedWords(word, relationship = 'all') {
        const cacheKey = `related:${word}:${relationship}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const prompt = this.buildRelatedWordsPrompt(word, relationship);
        
        try {
            const response = await this.makeRequest(prompt);
            const relatedWords = this.parseRelatedWordsResponse(response);
            
            this.cacheResult(cacheKey, relatedWords);
            return relatedWords;
        } catch (error) {
            console.warn(`Failed to get related words for "${word}":`, error.message);
            return this.getDefaultRelatedWords(word);
        }
    }

    buildEtymologyPrompt(word) {
        return `Provide detailed etymology for the word "${word}". Include:
1. Original language and root
2. Historical development and changes
3. Related words in the same language family
4. Key morphemes and their meanings
5. Approximate time periods of major changes

Format your response as structured data that can be parsed:
ORIGIN: [language]
ROOT: [original form]
DEVELOPMENT: [historical changes]
RELATED: [related words]
MORPHEMES: [morpheme breakdown]
PERIODS: [time periods]`;
    }

    buildDefinitionPrompt(word) {
        return `Provide comprehensive definitions for "${word}". Include:
1. Primary meanings (numbered)
2. Secondary meanings
3. Technical or specialized uses
4. Part of speech variations
5. Example usage contexts

Format as:
PRIMARY: [main definitions]
SECONDARY: [other meanings]
TECHNICAL: [specialized uses]
POS: [parts of speech]
EXAMPLES: [usage examples]`;
    }

    buildSemanticPrompt(word) {
        return `Analyze the semantic components of "${word}". Provide:
1. Core conceptual meaning
2. Connotative associations
3. Semantic field relationships
4. Cultural or contextual meanings
5. Metaphorical extensions

Format as:
CORE: [core meaning]
CONNOTATIONS: [associations]
FIELD: [semantic field]
CULTURAL: [cultural meanings]
METAPHORS: [metaphorical uses]`;
    }

    buildRelatedWordsPrompt(word, relationship) {
        const relationshipTypes = {
            'all': 'all types of relationships',
            'synonyms': 'synonyms and near-synonyms',
            'antonyms': 'antonyms and opposites',
            'derivatives': 'derived words and variants',
            'compounds': 'compound words containing this word',
            'cognates': 'cognates in related languages'
        };

        const relationshipText = relationshipTypes[relationship] || relationshipTypes['all'];

        return `Find words related to "${word}" by ${relationshipText}. Provide:
1. Direct relationships with strength (1-10)
2. Semantic relationships
3. Etymological relationships
4. Morphological relationships

Format as:
DIRECT: [word:strength, word:strength]
SEMANTIC: [related by meaning]
ETYMOLOGICAL: [same origin]
MORPHOLOGICAL: [shared morphemes]`;
    }

    async makeRequest(prompt) {
        const requestData = {
            model: this.model,
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.3,
                top_k: 10,
                top_p: 0.9
            }
        };

        const response = await axios.post(`${this.baseUrl}/api/generate`, requestData, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response.data.response;
    }

    parseEtymologyResponse(response) {
        const etymology = {
            origin: 'unknown',
            root: '',
            development: '',
            relatedWords: [],
            morphemes: [],
            periods: []
        };

        try {
            if (!response || typeof response !== 'string') {
                return etymology;
            }
            
            const lines = response.split('\n');
            for (const line of lines) {
                if (!line || typeof line !== 'string') continue;
                
                const colonIndex = line.indexOf(':');
                if (colonIndex === -1) continue;

                const key = line.substring(0, colonIndex).trim().toUpperCase();
                const value = line.substring(colonIndex + 1).trim();
                
                if (!key || !value) continue;

                switch (key) {
                    case 'ORIGIN':
                        etymology.origin = value;
                        break;
                    case 'ROOT':
                        etymology.root = value;
                        break;
                    case 'DEVELOPMENT':
                        etymology.development = value;
                        break;
                    case 'RELATED':
                        try {
                            etymology.relatedWords = value.split(',').map(w => w.trim()).filter(w => w);
                        } catch {
                            etymology.relatedWords = [];
                        }
                        break;
                    case 'MORPHEMES':
                        etymology.morphemes = this.parseMorphemes(value) || [];
                        break;
                    case 'PERIODS':
                        try {
                            etymology.periods = value.split(',').map(p => p.trim()).filter(p => p);
                        } catch {
                            etymology.periods = [];
                        }
                        break;
                }
            }
        } catch (error) {
            console.warn('Failed to parse etymology response:', error.message);
        }

        return etymology;
    }

    parseDefinitionResponse(response) {
        const definitions = {
            primary: [],
            secondary: [],
            technical: [],
            partOfSpeech: [],
            examples: []
        };

        try {
            const lines = response.split('\n');
            for (const line of lines) {
                const colonIndex = line.indexOf(':');
                if (colonIndex === -1) continue;

                const key = line.substring(0, colonIndex).trim().toUpperCase();
                const value = line.substring(colonIndex + 1).trim();

                switch (key) {
                    case 'PRIMARY':
                        definitions.primary = this.parseDefinitionList(value);
                        break;
                    case 'SECONDARY':
                        definitions.secondary = this.parseDefinitionList(value);
                        break;
                    case 'TECHNICAL':
                        definitions.technical = this.parseDefinitionList(value);
                        break;
                    case 'POS':
                        definitions.partOfSpeech = value.split(',').map(p => p.trim()).filter(p => p);
                        break;
                    case 'EXAMPLES':
                        definitions.examples = this.parseDefinitionList(value);
                        break;
                }
            }
        } catch (error) {
            console.warn('Failed to parse definition response:', error.message);
        }

        return definitions;
    }

    parseSemanticResponse(response) {
        const semantic = {
            core: '',
            connotations: [],
            semanticField: '',
            cultural: [],
            metaphors: []
        };

        try {
            const lines = response.split('\n');
            for (const line of lines) {
                const colonIndex = line.indexOf(':');
                if (colonIndex === -1) continue;

                const key = line.substring(0, colonIndex).trim().toUpperCase();
                const value = line.substring(colonIndex + 1).trim();

                switch (key) {
                    case 'CORE':
                        semantic.core = value;
                        break;
                    case 'CONNOTATIONS':
                        semantic.connotations = value.split(',').map(c => c.trim()).filter(c => c);
                        break;
                    case 'FIELD':
                        semantic.semanticField = value;
                        break;
                    case 'CULTURAL':
                        semantic.cultural = value.split(',').map(c => c.trim()).filter(c => c);
                        break;
                    case 'METAPHORS':
                        semantic.metaphors = value.split(',').map(m => m.trim()).filter(m => m);
                        break;
                }
            }
        } catch (error) {
            console.warn('Failed to parse semantic response:', error.message);
        }

        return semantic;
    }

    parseRelatedWordsResponse(response) {
        const related = {
            direct: new Map(),
            semantic: [],
            etymological: [],
            morphological: []
        };

        try {
            const lines = response.split('\n');
            for (const line of lines) {
                const colonIndex = line.indexOf(':');
                if (colonIndex === -1) continue;

                const key = line.substring(0, colonIndex).trim().toUpperCase();
                const value = line.substring(colonIndex + 1).trim();

                switch (key) {
                    case 'DIRECT':
                        related.direct = this.parseWeightedWords(value);
                        break;
                    case 'SEMANTIC':
                        related.semantic = value.split(',').map(w => w.trim()).filter(w => w);
                        break;
                    case 'ETYMOLOGICAL':
                        related.etymological = value.split(',').map(w => w.trim()).filter(w => w);
                        break;
                    case 'MORPHOLOGICAL':
                        related.morphological = value.split(',').map(w => w.trim()).filter(w => w);
                        break;
                }
            }
        } catch (error) {
            console.warn('Failed to parse related words response:', error.message);
        }

        return related;
    }

    parseMorphemes(value) {
        try {
            if (!value || typeof value !== 'string') {
                return [];
            }
            
            return value.split(',').map(m => {
                if (!m || typeof m !== 'string') return null;
                
                const parts = m.trim().split(':');
                const morphemeValue = parts[0] ? parts[0].trim() : m.trim();
                
                if (!morphemeValue) return null;
                
                return {
                    type: 'parsed',
                    value: morphemeValue,
                    meaning: parts[1] ? parts[1].trim() : 'unknown'
                };
            }).filter(m => m && m.value);
        } catch (error) {
            console.warn(`Failed to parse morphemes from "${value}": ${error.message}`);
            return [];
        }
    }

    parseDefinitionList(value) {
        return value.split(/[;,]/).map(d => d.trim()).filter(d => d);
    }

    parseWeightedWords(value) {
        const weightedWords = new Map();
        const pairs = value.split(',');
        
        for (const pair of pairs) {
            const parts = pair.trim().split(':');
            if (parts.length === 2) {
                const word = parts[0].trim();
                const weight = parseInt(parts[1]) || 5;
                weightedWords.set(word, weight);
            }
        }
        
        return weightedWords;
    }

    getDefaultEtymology(word) {
        return {
            origin: 'unknown',
            root: word,
            development: 'etymology unavailable',
            relatedWords: [],
            morphemes: [{ morpheme: word, meaning: 'unknown' }],
            periods: ['modern']
        };
    }

    getDefaultDefinitions(word) {
        return {
            primary: [`Definition of ${word} unavailable`],
            secondary: [],
            technical: [],
            partOfSpeech: ['unknown'],
            examples: []
        };
    }

    getDefaultSemanticAnalysis(word) {
        return {
            core: `Core meaning of ${word}`,
            connotations: [],
            semanticField: 'general',
            cultural: [],
            metaphors: []
        };
    }

    getDefaultRelatedWords(word) {
        return {
            direct: new Map(),
            semantic: [],
            etymological: [],
            morphological: []
        };
    }

    cacheResult(key, result) {
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, result);
    }

    clearCache() {
        this.cache.clear();
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            keys: Array.from(this.cache.keys())
        };
    }
}