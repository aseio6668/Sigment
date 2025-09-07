export class PhoneticMapper {
    constructor(languageConfig = {}) {
        this.languageConfig = {
            preserveEnglishPhonetics: true,
            transformationRules: {},
            characterMapping: new Map(),
            ...languageConfig
        };
        
        this.initializeBaseMappings();
    }

    initializeBaseMappings() {
        this.vowelTransforms = new Map([
            ['a', { variants: ['a', 'ah', 'ay'], weight: [0.6, 0.2, 0.2] }],
            ['e', { variants: ['e', 'eh', 'ee'], weight: [0.7, 0.2, 0.1] }],
            ['i', { variants: ['i', 'ih', 'ai'], weight: [0.6, 0.3, 0.1] }],
            ['o', { variants: ['o', 'oh', 'oo'], weight: [0.6, 0.3, 0.1] }],
            ['u', { variants: ['u', 'uh', 'oo'], weight: [0.6, 0.3, 0.1] }],
            ['y', { variants: ['y', 'ih', 'ai'], weight: [0.5, 0.3, 0.2] }]
        ]);

        this.consonantClusters = new Map([
            ['th', { transforms: ['th', 'tth', 'dhh'], phonetic: '/θ/' }],
            ['ch', { transforms: ['ch', 'tch', 'kh'], phonetic: '/ʧ/' }],
            ['sh', { transforms: ['sh', 'shh', 'zh'], phonetic: '/ʃ/' }],
            ['ph', { transforms: ['ph', 'ff', 'f'], phonetic: '/f/' }],
            ['gh', { transforms: ['gh', 'g', 'f'], phonetic: '/g/' }],
            ['ck', { transforms: ['ck', 'k', 'kk'], phonetic: '/k/' }],
            ['ng', { transforms: ['ng', 'ngg', 'ŋ'], phonetic: '/ŋ/' }]
        ]);

        this.phoneticPatterns = {
            'silent_e': /(.+)e$/,
            'double_consonant': /(.)\1/g,
            'vowel_consonant_e': /([aeiou])([bcdfghjklmnpqrstvwxz])e$/,
            'consonant_y': /([bcdfghjklmnpqrstvwxz])y$/
        };
    }

    mapWordToSigment(englishWord, etymologyAnalysis, languageStyle = 'default', options = {}) {
        const sigmentWord = this.transformWord(englishWord, etymologyAnalysis, languageStyle);
        const useAsciiPronunciation = options.asciiPronunciation || false;
        
        return {
            english: englishWord,
            sigment: sigmentWord,
            pronunciation: useAsciiPronunciation ? 
                this.generateAsciiPronunciation(sigmentWord) : 
                this.generatePronunciation(sigmentWord),
            phoneticStructure: this.analyzePhoneticStructure(sigmentWord),
            transformationRules: this.getAppliedRules(englishWord, sigmentWord),
            etymologicalBasis: this.deriveEtymologicalLogic(etymologyAnalysis)
        };
    }

    transformWord(word, etymology, style) {
        let transformed = word.toLowerCase();
        const morphemes = etymology.morphemes || [];
        
        transformed = this.applySystematicTransformations(transformed, etymology, style);
        transformed = this.applyMorphemeBasedRules(transformed, morphemes, style);
        transformed = this.applyPhoneticConsistency(transformed);
        
        return transformed;
    }

    applySystematicTransformations(word, etymology, style) {
        let result = word;
        
        switch (style) {
            case 'consonant_shift':
                result = this.applyConsonantShift(result, etymology);
                break;
            case 'vowel_harmony':
                result = this.applyVowelHarmony(result);
                break;
            case 'morpheme_emphasis':
                result = this.applyMorphemeEmphasis(result, etymology);
                break;
            case 'phonetic_logic':
                result = this.applyPhoneticLogic(result, etymology);
                break;
            default:
                result = this.applyDefaultTransformation(result, etymology);
        }
        
        return result;
    }

    applyConsonantShift(word, etymology) {
        const shiftRules = new Map([
            ['b', 'p'], ['p', 'b'], ['d', 't'], ['t', 'd'],
            ['g', 'k'], ['k', 'g'], ['v', 'f'], ['f', 'v'],
            ['z', 's'], ['s', 'z'], ['j', 'y'], ['w', 'v']
        ]);

        let result = '';
        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            if (shiftRules.has(char)) {
                const isRootMorpheme = this.isInRootMorpheme(i, word, etymology);
                if (isRootMorpheme) {
                    result += shiftRules.get(char);
                } else {
                    result += char;
                }
            } else {
                result += char;
            }
        }
        return result;
    }

    applyVowelHarmony(word) {
        const vowels = ['a', 'e', 'i', 'o', 'u'];
        const harmony = {
            'front': ['e', 'i'],
            'back': ['a', 'o', 'u']
        };
        
        let dominantClass = 'back';
        let vowelCount = { front: 0, back: 0 };
        
        for (const char of word) {
            if (harmony.front.includes(char)) vowelCount.front++;
            if (harmony.back.includes(char)) vowelCount.back++;
        }
        
        dominantClass = vowelCount.front > vowelCount.back ? 'front' : 'back';
        
        let result = '';
        for (const char of word) {
            if (vowels.includes(char)) {
                if (dominantClass === 'front' && harmony.back.includes(char)) {
                    result += harmony.front[Math.floor(Math.random() * harmony.front.length)];
                } else if (dominantClass === 'back' && harmony.front.includes(char)) {
                    result += harmony.back[Math.floor(Math.random() * harmony.back.length)];
                } else {
                    result += char;
                }
            } else {
                result += char;
            }
        }
        return result;
    }

    applyMorphemeEmphasis(word, etymology) {
        if (!etymology.morphemes) return word;
        
        let result = word;
        let offset = 0;
        
        for (const morpheme of etymology.morphemes) {
            if (morpheme.type === 'root') {
                const start = result.indexOf(morpheme.value, offset);
                if (start !== -1) {
                    const morphemeText = result.substring(start, start + morpheme.value.length);
                    const emphasized = this.emphasizeMorpheme(morphemeText, morpheme);
                    result = result.substring(0, start) + emphasized + result.substring(start + morpheme.value.length);
                    offset = start + emphasized.length;
                }
            }
        }
        
        return result;
    }

    applyPhoneticLogic(word, etymology) {
        let result = word;
        
        result = this.handleConsonantClusters(result);
        result = this.applySyllableRules(result);
        result = this.maintainPhoneticIntegrity(result);
        
        return result;
    }

    applyDefaultTransformation(word, etymology) {
        let result = word;
        
        const semanticWeight = this.calculateOverallSemanticWeight(etymology);
        const transformationIntensity = Math.min(1.0, semanticWeight * 0.5);
        
        if (transformationIntensity > 0.3) {
            result = this.applyMildConsonantShift(result);
        }
        
        if (transformationIntensity > 0.6) {
            result = this.applyVowelVariation(result);
        }
        
        return result;
    }

    applyMorphemeBasedRules(word, morphemes, style) {
        let result = word;
        
        for (const morpheme of morphemes) {
            if (morpheme.type === 'prefix') {
                result = this.transformPrefix(result, morpheme, style);
            } else if (morpheme.type === 'suffix') {
                result = this.transformSuffix(result, morpheme, style);
            } else if (morpheme.type === 'root') {
                result = this.transformRoot(result, morpheme, style);
            }
        }
        
        return result;
    }

    transformPrefix(word, morpheme, style) {
        return word;
    }

    transformSuffix(word, morpheme, style) {
        return word;
    }

    transformRoot(word, morpheme, style) {
        return word;
    }

    applyPhoneticConsistency(word) {
        let result = word;
        
        result = result.replace(/(.)\1{3,}/g, '$1$1');
        result = result.replace(/^(.)\1+/, '$1');
        result = result.replace(/(.)\1+$/, '$1');
        
        return result;
    }

    handleConsonantClusters(word) {
        let result = word;
        
        for (const [cluster, config] of this.consonantClusters) {
            if (result.includes(cluster)) {
                const replacement = config.transforms[0];
                result = result.replace(new RegExp(cluster, 'g'), replacement);
            }
        }
        
        return result;
    }

    generatePronunciation(sigmentWord) {
        let pronunciation = '/';
        
        for (let i = 0; i < sigmentWord.length; i++) {
            const char = sigmentWord[i];
            const phoneme = this.getPhoneme(char, sigmentWord, i);
            pronunciation += phoneme;
        }
        
        pronunciation += '/';
        return pronunciation;
    }

    generateAsciiPronunciation(sigmentWord) {
        let pronunciation = '';
        
        for (let i = 0; i < sigmentWord.length; i++) {
            const char = sigmentWord[i];
            const asciiPhoneme = this.getAsciiPhoneme(char, sigmentWord, i);
            pronunciation += asciiPhoneme;
        }
        
        return pronunciation;
    }

    getPhoneme(char, word, position) {
        const phoneticMap = {
            'a': 'æ', 'e': 'ɛ', 'i': 'ɪ', 'o': 'ɔ', 'u': 'ʌ',
            'b': 'b', 'c': 'k', 'd': 'd', 'f': 'f', 'g': 'g',
            'h': 'h', 'j': 'ʤ', 'k': 'k', 'l': 'l', 'm': 'm',
            'n': 'n', 'p': 'p', 'q': 'kw', 'r': 'r', 's': 's',
            't': 't', 'v': 'v', 'w': 'w', 'x': 'ks', 'y': 'j', 'z': 'z'
        };
        
        return phoneticMap[char.toLowerCase()] || char;
    }

    getAsciiPhoneme(char, word, position) {
        const lowerChar = char.toLowerCase();
        const nextChar = word[position + 1]?.toLowerCase() || '';
        const prevChar = word[position - 1]?.toLowerCase() || '';
        
        // Handle common two-letter combinations first
        const twoChar = lowerChar + nextChar;
        const asciiCombinations = {
            'th': 'th',    // "th" as in "the" 
            'ch': 'ch',    // "ch" as in "chair"
            'sh': 'sh',    // "sh" as in "shoe"
            'ph': 'f',     // "ph" as in "phone" -> "f"
            'gh': 'g',     // "gh" as in "ghost" -> "g" 
            'ck': 'k',     // "ck" as in "back" -> "k"
            'ng': 'ng',    // "ng" as in "ring"
            'qu': 'kw'     // "qu" as in "queen" -> "kw"
        };
        
        if (asciiCombinations[twoChar]) {
            // Mark next character to skip
            this._skipNext = true;
            return asciiCombinations[twoChar];
        }
        
        // Skip if previous combination marked this character
        if (this._skipNext) {
            this._skipNext = false;
            return '';
        }
        
        // Single character ASCII phonetic mapping
        const asciiPhoneticMap = {
            // Vowels - using common keyboard representations
            'a': 'a',      // "cat" -> "a" 
            'e': 'e',      // "bed" -> "e"
            'i': 'i',      // "bit" -> "i"
            'o': 'o',      // "pot" -> "o" 
            'u': 'u',      // "but" -> "u"
            'y': 'y',      // "yes" -> "y"
            
            // Consonants - mostly stay the same
            'b': 'b', 'c': 'k', 'd': 'd', 'f': 'f', 'g': 'g',
            'h': 'h', 'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm',
            'n': 'n', 'p': 'p', 'r': 'r', 's': 's',
            't': 't', 'v': 'v', 'w': 'w', 'x': 'ks', 'z': 'z'
        };
        
        return asciiPhoneticMap[lowerChar] || lowerChar;
    }

    analyzePhoneticStructure(word) {
        const vowels = 'aeiouAEIOU';
        const consonants = 'bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ';
        
        let structure = '';
        let syllables = 0;
        let lastWasVowel = false;
        
        for (const char of word) {
            if (vowels.includes(char)) {
                structure += 'V';
                if (!lastWasVowel) syllables++;
                lastWasVowel = true;
            } else if (consonants.includes(char)) {
                structure += 'C';
                lastWasVowel = false;
            } else {
                structure += 'X';
                lastWasVowel = false;
            }
        }
        
        return {
            pattern: structure,
            syllableCount: syllables || 1,
            complexity: this.calculatePhoneticComplexity(word),
            rhythm: this.determineRhythm(structure)
        };
    }

    calculatePhoneticComplexity(word) {
        let complexity = 0;
        
        for (const [cluster] of this.consonantClusters) {
            if (word.includes(cluster)) complexity += 0.2;
        }
        
        complexity += word.length * 0.05;
        
        const uniqueChars = new Set(word.toLowerCase()).size;
        complexity += uniqueChars * 0.1;
        
        return Math.min(1.0, complexity);
    }

    determineRhythm(pattern) {
        const rhythmTypes = ['iambic', 'trochaic', 'dactylic', 'anapestic'];
        
        if (pattern.match(/^(CV)+$/)) return 'alternating';
        if (pattern.match(/^(CVC)+$/)) return 'closed_syllable';
        if (pattern.match(/^C*V+C*$/)) return 'vowel_centered';
        
        return rhythmTypes[Math.floor(Math.random() * rhythmTypes.length)];
    }

    getAppliedRules(original, transformed) {
        const rules = [];
        
        if (original.length !== transformed.length) {
            rules.push('length_modification');
        }
        
        for (let i = 0; i < Math.min(original.length, transformed.length); i++) {
            if (original[i] !== transformed[i]) {
                rules.push(`char_${i}_${original[i]}_to_${transformed[i]}`);
            }
        }
        
        return rules;
    }

    deriveEtymologicalLogic(etymology) {
        if (!etymology) return { basis: 'default_transformation' };
        
        return {
            basis: 'etymological_analysis',
            morphemeInfluence: etymology.morphemes?.length || 0,
            semanticFactors: etymology.semanticComponents?.length || 0,
            phoneticConsiderations: etymology.phoneticStructure?.pattern || 'unknown'
        };
    }

    isInRootMorpheme(position, word, etymology) {
        if (!etymology.morphemes) return true;
        
        for (const morpheme of etymology.morphemes) {
            if (morpheme.type === 'root') {
                const start = word.indexOf(morpheme.value);
                const end = start + morpheme.value.length;
                if (position >= start && position < end) {
                    return true;
                }
            }
        }
        return false;
    }

    calculateOverallSemanticWeight(etymology) {
        if (!etymology.semanticComponents) return 0.5;
        
        let totalWeight = 0;
        for (const component of etymology.semanticComponents) {
            totalWeight += component.semanticWeight || 0.5;
        }
        
        return totalWeight / etymology.semanticComponents.length;
    }

    emphasizeMorpheme(morpheme, morphemeInfo) {
        if (morphemeInfo.type === 'root') {
            return this.addRootEmphasis(morpheme);
        }
        return morpheme;
    }

    addRootEmphasis(morpheme) {
        if (morpheme.length > 3) {
            const mid = Math.floor(morpheme.length / 2);
            return morpheme.substring(0, mid) + morpheme[mid] + morpheme.substring(mid);
        }
        return morpheme;
    }

    applyMildConsonantShift(word) {
        const mildShifts = new Map([
            ['c', 'k'], ['k', 'c'], ['f', 'ph'], ['ph', 'f']
        ]);
        
        let result = '';
        for (const char of word) {
            result += mildShifts.get(char) || char;
        }
        return result;
    }

    applyVowelVariation(word) {
        const vowelVariants = {
            'a': ['a', 'aa'], 'e': ['e', 'ee'], 'i': ['i', 'ii'],
            'o': ['o', 'oo'], 'u': ['u', 'uu']
        };
        
        let result = '';
        for (const char of word) {
            if (vowelVariants[char]) {
                const variants = vowelVariants[char];
                result += variants[Math.floor(Math.random() * variants.length)];
            } else {
                result += char;
            }
        }
        return result;
    }

    applySyllableRules(word) {
        return word.replace(/([aeiou])([aeiou])/g, '$1$2');
    }

    maintainPhoneticIntegrity(word) {
        return word.replace(/(.)\1{2,}/g, '$1$1');
    }
}