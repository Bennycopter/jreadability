This is an **unofficial** implementation of jReadability's algorithm in JavaScript, adapted from [@joshdavham's implementation in Python](https://github.com/joshdavham/jreadability).

The Japanese text readability measurement system 'jReadability' (https://jreadability.net) is developed under Grants-in-Aid for Scientific Research (KAKEN) 25370573.  Please refer to their website for more information: https://jreadability.net/

# Installation

Install these:
- This library via `npm i jreadability`
- [MeCab](https://taku910.github.io/mecab/)
- [UniDic dictionary](https://clrd.ninjal.ac.jp/unidic/en/) (Contemporary written Japanese without model.def and matrix.def)

# Example usage

```js
import jReadability from "jreadability";
const analyzer = new jReadability.Analyzer("/path/to/unidic/dictionary/folder");

// Promise-based usage
const score = await analyzer.analyze(/* your Japanese text */);

// Synchronous usage
const score = analyzer.analyzeSync(/* your Japanese text */);
```