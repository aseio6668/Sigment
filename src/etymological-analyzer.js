export class EtymologicalAnalyzer {
    constructor(ollamaClient = null) {
        this.ollamaClient = ollamaClient;
        this.morphemePatterns = {
            prefixes: ['un-', 're-', 'pre-', 'dis-', 'mis-', 'over-', 'under-', 'out-', 'up-', 'anti-', 'de-', 'non-'],
            suffixes: ['-ing', '-ed', '-er', '-est', '-ly', '-tion', '-sion', '-ness', '-ment', '-ful', '-less', '-able', '-ible'],
            roots: new Map()
        };
        this.phoneticMap = new Map();
        this.etymologyCache = new Map();
    }

    async analyzeWord(word) {
        if (this.etymologyCache.has(word)) {
            return this.etymologyCache.get(word);
        }

        const analysis = {
            word,
            morphemes: this.decomposeMorphemes(word),
            phoneticStructure: this.analyzePhoneticStructure(word),
            etymology: await this.getEtymology(word),
            semanticComponents: this.extractSemanticComponents(word)
        };

        this.etymologyCache.set(word, analysis);
        return analysis;
    }

    decomposeMorphemes(word) {
        const morphemes = [];
        let remaining = word.toLowerCase();

        for (const prefix of this.morphemePatterns.prefixes) {
            if (remaining.startsWith(prefix)) {
                morphemes.push({ type: 'prefix', value: prefix, meaning: this.getPrefixMeaning(prefix) });
                remaining = remaining.substring(prefix.length);
                break;
            }
        }

        for (const suffix of this.morphemePatterns.suffixes) {
            if (remaining.endsWith(suffix)) {
                morphemes.push({ type: 'suffix', value: suffix, meaning: this.getSuffixMeaning(suffix) });
                remaining = remaining.substring(0, remaining.length - suffix.length);
                break;
            }
        }

        if (remaining) {
            morphemes.push({ type: 'root', value: remaining, meaning: 'core meaning' });
        }

        return morphemes;
    }

    analyzePhoneticStructure(word) {
        const vowels = 'aeiouAEIOU';
        const consonants = 'bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ';
        
        const structure = [];
        for (const char of word) {
            if (vowels.includes(char)) {
                structure.push('V');
            } else if (consonants.includes(char)) {
                structure.push('C');
            } else {
                structure.push('X');
            }
        }

        return {
            pattern: structure.join(''),
            syllableCount: this.estimateSyllables(word),
            stressPattern: this.estimateStressPattern(word)
        };
    }

    async getEtymology(word) {
        if (this.ollamaClient) {
            try {
                const response = await this.ollamaClient.getEtymology(word);
                return response;
            } catch (error) {
                console.warn(`Failed to get etymology from Ollama for "${word}": ${error.message}`);
            }
        }

        return {
            origin: 'unknown',
            historicalForms: [],
            relatedWords: [],
            meanings: ['definition unavailable']
        };
    }

    extractSemanticComponents(word) {
        const components = [];
        const morphemes = this.decomposeMorphemes(word);
        
        for (const morpheme of morphemes) {
            components.push({
                component: morpheme.value,
                semanticWeight: this.calculateSemanticWeight(morpheme),
                conceptualCategory: this.categorizeSemantics(morpheme)
            });
        }

        return components;
    }

    getPrefixMeaning(prefix) {
        const meanings = {
            'un-': 'not, opposite of',
            're-': 'again, back',
            'pre-': 'before',
            'dis-': 'not, opposite',
            'mis-': 'wrongly, badly',
            'over-': 'too much, above',
            'under-': 'too little, below',
            'out-': 'beyond, more than',
            'up-': 'upward, increase',
            'anti-': 'against',
            'de-': 'remove, reverse',
            'non-': 'not'
        };
        return meanings[prefix] || 'modifier';
    }

    getSuffixMeaning(suffix) {
        const meanings = {
            '-ing': 'action, process',
            '-ed': 'past action, completed',
            '-er': 'one who does',
            '-est': 'most, superlative',
            '-ly': 'in the manner of',
            '-tion': 'action, state',
            '-sion': 'action, state',
            '-ness': 'quality, state',
            '-ment': 'action, result',
            '-ful': 'full of',
            '-less': 'without',
            '-able': 'capable of',
            '-ible': 'capable of'
        };
        return meanings[suffix] || 'modifier';
    }

    estimateSyllables(word) {
        const vowelGroups = word.toLowerCase().match(/[aeiouy]+/g);
        return vowelGroups ? vowelGroups.length : 1;
    }

    estimateStressPattern(word) {
        const syllables = this.estimateSyllables(word);
        if (syllables === 1) return ['primary'];
        if (syllables === 2) return ['primary', 'secondary'];
        
        const pattern = new Array(syllables).fill('unstressed');
        pattern[0] = 'primary';
        if (syllables > 2) pattern[syllables - 2] = 'secondary';
        
        return pattern;
    }

    calculateSemanticWeight(morpheme) {
        if (morpheme.type === 'root') return 1.0;
        if (morpheme.type === 'prefix') return 0.6;
        if (morpheme.type === 'suffix') return 0.4;
        return 0.3;
    }

    categorizeSemantics(morpheme) {
        const categories = {
            'action': ['-ing', '-tion', '-sion', '-ment'],
            'quality': ['-ness', '-ful', '-less'],
            'agent': ['-er', '-or'],
            'degree': ['-est', '-er', 'over-', 'under-'],
            'negation': ['un-', 'dis-', 'non-', '-less'],
            'temporal': ['re-', 'pre-', '-ed'],
            'spatial': ['over-', 'under-', 'out-', 'up-']
        };

        for (const [category, morphemes] of Object.entries(categories)) {
            if (morphemes.some(m => morpheme.value.includes(m) || m.includes(morpheme.value))) {
                return category;
            }
        }

        return 'conceptual';
    }
}