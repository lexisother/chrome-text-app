/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as strings from '../../../base/common/strings.js';
import { LineTokens } from '../core/lineTokens.js';
import { NULL_STATE, nullTokenize2 } from './nullMode.js';
const fallback = {
    getInitialState: () => NULL_STATE,
    tokenize2: (buffer, hasEOL, state, deltaOffset) => nullTokenize2(0 /* Null */, buffer, state, deltaOffset)
};
export function tokenizeToString(text, languageIdCodec, tokenizationSupport = fallback) {
    return _tokenizeToString(text, languageIdCodec, tokenizationSupport || fallback);
}
export function tokenizeLineToHTML(text, viewLineTokens, colorMap, startOffset, endOffset, tabSize, useNbsp) {
    let result = `<div>`;
    let charIndex = startOffset;
    let tabsCharDelta = 0;
    let prevIsSpace = true;
    for (let tokenIndex = 0, tokenCount = viewLineTokens.getCount(); tokenIndex < tokenCount; tokenIndex++) {
        const tokenEndIndex = viewLineTokens.getEndOffset(tokenIndex);
        if (tokenEndIndex <= startOffset) {
            continue;
        }
        let partContent = '';
        for (; charIndex < tokenEndIndex && charIndex < endOffset; charIndex++) {
            const charCode = text.charCodeAt(charIndex);
            switch (charCode) {
                case 9 /* Tab */:
                    let insertSpacesCount = tabSize - (charIndex + tabsCharDelta) % tabSize;
                    tabsCharDelta += insertSpacesCount - 1;
                    while (insertSpacesCount > 0) {
                        if (useNbsp && prevIsSpace) {
                            partContent += '&#160;';
                            prevIsSpace = false;
                        }
                        else {
                            partContent += ' ';
                            prevIsSpace = true;
                        }
                        insertSpacesCount--;
                    }
                    break;
                case 60 /* LessThan */:
                    partContent += '&lt;';
                    prevIsSpace = false;
                    break;
                case 62 /* GreaterThan */:
                    partContent += '&gt;';
                    prevIsSpace = false;
                    break;
                case 38 /* Ampersand */:
                    partContent += '&amp;';
                    prevIsSpace = false;
                    break;
                case 0 /* Null */:
                    partContent += '&#00;';
                    prevIsSpace = false;
                    break;
                case 65279 /* UTF8_BOM */:
                case 8232 /* LINE_SEPARATOR */:
                case 8233 /* PARAGRAPH_SEPARATOR */:
                case 133 /* NEXT_LINE */:
                    partContent += '\ufffd';
                    prevIsSpace = false;
                    break;
                case 13 /* CarriageReturn */:
                    // zero width space, because carriage return would introduce a line break
                    partContent += '&#8203';
                    prevIsSpace = false;
                    break;
                case 32 /* Space */:
                    if (useNbsp && prevIsSpace) {
                        partContent += '&#160;';
                        prevIsSpace = false;
                    }
                    else {
                        partContent += ' ';
                        prevIsSpace = true;
                    }
                    break;
                default:
                    partContent += String.fromCharCode(charCode);
                    prevIsSpace = false;
            }
        }
        result += `<span style="${viewLineTokens.getInlineStyle(tokenIndex, colorMap)}">${partContent}</span>`;
        if (tokenEndIndex > endOffset || charIndex >= endOffset) {
            break;
        }
    }
    result += `</div>`;
    return result;
}
function _tokenizeToString(text, languageIdCodec, tokenizationSupport) {
    let result = `<div class="monaco-tokenized-source">`;
    const lines = strings.splitLines(text);
    let currentState = tokenizationSupport.getInitialState();
    for (let i = 0, len = lines.length; i < len; i++) {
        const line = lines[i];
        if (i > 0) {
            result += `<br/>`;
        }
        const tokenizationResult = tokenizationSupport.tokenize2(line, true, currentState, 0);
        LineTokens.convertToEndOffset(tokenizationResult.tokens, line.length);
        const lineTokens = new LineTokens(tokenizationResult.tokens, line, languageIdCodec);
        const viewLineTokens = lineTokens.inflate();
        let startOffset = 0;
        for (let j = 0, lenJ = viewLineTokens.getCount(); j < lenJ; j++) {
            const type = viewLineTokens.getClassName(j);
            const endIndex = viewLineTokens.getEndOffset(j);
            result += `<span class="${type}">${strings.escape(line.substring(startOffset, endIndex))}</span>`;
            startOffset = endIndex;
        }
        currentState = tokenizationResult.endState;
    }
    result += `</div>`;
    return result;
}
