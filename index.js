import { analyze, analyzeSync } from "@enjoyjs/node-mecab";

export class Analyzer {

    dictionaryDirectory;

    constructor(unidicDictionaryPath) {
        this.dictionaryDirectory = unidicDictionaryPath;
    }

    async analyze(text) {
        const mecabRawOutput = await analyze(text, { dicdir: this.dictionaryDirectory });
        return this._calculateReadability(text, mecabRawOutput);
    }

    analyzeSync(text) {
        const mecabRawOutput = analyzeSync(text, { dicdir: this.dictionaryDirectory });
        return this._calculateReadability(text, mecabRawOutput);
    }

    _calculateReadability(text, mecabRawOutput) {
        const tokens = this._getWordTokensFromMecabRawOutput(mecabRawOutput);
        const tokenProportions = this._getTokenProportions(tokens);
        const averageSentenceLength = this._getAverageSentenceTokenCounts(tokens);

        return 11.724
            - 0.056 * averageSentenceLength
            - 0.126 * tokenProportions.kango
            - 0.042 * tokenProportions.wago
            - 0.145 * tokenProportions.verbs
            - 0.044 * tokenProportions.particles;
    }

    _getWordTokensFromMecabRawOutput(mecabRawOutput) {
        const tokenLines = mecabRawOutput.split("\n").filter(line=>line.trim()!=="EOS");

        return tokenLines.map(tokenLine=>{
            // Each line looks like this:
            // 先生    名詞,普通名詞,一般,*,*,*,センセイ,先生,先生,センセー,先生,センセー,漢,*,*,*,*,*,*,体,センセイ,センセイ,センセイ,センセイ,3,C2,*,5642161131495936,20526
            const [surfaceForm, tokenDetailString] = tokenLine.split("\t");

            // There are a lot of details, but the only ones we care about are:
            //  => pos1 (part of speech tag #1) - index=0
            //  => pos2 (part of speech tag #2) - index=1
            //  => goshu (word origin) - index=12
            const tokenDetails = tokenDetailString.split(",");
            const pos1 = tokenDetails[0];
            const pos2 = tokenDetails[1];
            const goshu = tokenDetails[12];

            return { surfaceForm, pos1, pos2, goshu };
        })
    }

    _getTokenProportions(tokens) {
        const tokenCounts = {
            kango: 0,
            wago: 0,
            verbs: 0,
            particles: 0,
        }

        for (const token of tokens) {
            switch (token.goshu) {
                // 漢 - 'kan', meaning Chinese
                case "漢": tokenCounts.kango++; break;
                // 和 - 'wa', meaning Japanese
                case "和": tokenCounts.wago++; break;
            }
            switch (token.pos1) {
                // Verbs, but not certain verbs like the あり in あります
                case "動詞": if (token.pos2 !== "非自立可能") tokenCounts.verbs++; break;
                // Particles
                case "助詞": tokenCounts.particles++; break;
            }
        }

        const numTokensTotal = tokens.length;

        return {
            kango: 100 * tokenCounts.kango / numTokensTotal,
            wago: 100 * tokenCounts.wago / numTokensTotal,
            verbs: 100 * tokenCounts.verbs / numTokensTotal,
            particles: 100 * tokenCounts.particles / numTokensTotal,
        }
    }

    _getAverageSentenceTokenCounts(tokens) {
        const tokensRemaining = [...tokens];
        let nextPunctuationIndex = 0;
        const sentences = [];
        while (true) {
            nextPunctuationIndex = tokensRemaining.findIndex(token=>/^[。？！．]$/.test(token.surfaceForm));
            if (nextPunctuationIndex !== -1) {
                sentences.push(tokensRemaining.splice(0, nextPunctuationIndex+1));
            }
            else {
                if (tokensRemaining.length > 0)
                    sentences.push(tokensRemaining.splice(0, Infinity))
                break;
            }
        }

        return sentences.map(sentence=>sentence.length).reduce((p,c)=>p+c,0) / sentences.length;
    }
}

export default { Analyzer }