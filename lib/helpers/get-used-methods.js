"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsedMethods = void 0;
function getUsedMethods(sourceCode, variable) {
    const result = [];
    const regex = new RegExp(`${variable}\\\.([a-zA-Z0-9]+)[\\\(<]`, 'g');
    let matches;
    while (matches = regex.exec(sourceCode)) {
        if (result.indexOf(matches[1]) === -1) {
            result.push(decodeURIComponent(matches[1]));
        }
    }
    return result;
}
exports.getUsedMethods = getUsedMethods;
