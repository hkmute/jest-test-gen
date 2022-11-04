"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUnitTest = void 0;
const template = require('lodash/template');
const trimEnd = require('lodash/trimEnd');
// import { MOCK_MODULES_BLACKLIST, IMPORT_MODULES_BLACKLIST } from './constants';
const path_1 = require("path");
const fs_1 = require("fs");
const debug_1 = require("debug");
const debug = (0, debug_1.default)('jest-test-gen/generate-unit-test');
// const cleanupImportPathName = (rawImportPath: string) => rawImportPath.toLowerCase().replace(/(\'|\")/g, '');
function generateUnitTest(path, _sourceCode, input) {
    if (input.classes.length > 1) {
        console.warn('Multiple classes detected in source file, will only consider the first class declaration');
    }
    debug('parsedSourceCode', input);
    const templateOptions = {
        instanceVariableName: 'instance',
    };
    const templateDir = `${__dirname}/../templates`;
    const relativePath = './' + (0, path_1.basename)(path, (0, path_1.extname)(path));
    const quoteSymbol = determinateUsedQuote(input.imports);
    let namedExportsList = [
        ...input.exportFunctions,
        ...input.exportPojos,
        ...input.exportComponents,
    ];
    if (input.exportClass) {
        namedExportsList.unshift(input.exportClass);
    }
    const namedExportsNameList = namedExportsList.filter(exp => !exp.isDefaultExport).map(exp => exp.name);
    const maybeDefaultExport = namedExportsList.find(exp => exp.isDefaultExport);
    if (maybeDefaultExport) {
        maybeDefaultExport.name = maybeDefaultExport.name || applyExportCapitalization(maybeDefaultExport, (0, path_1.basename)(path).replace(/\.\w+/, ''));
    }
    const templateDataMap = Object.assign({ namedExportsList: namedExportsNameList.join(', '), defaultExport: maybeDefaultExport, path: relativePath, quoteSymbol, 
        // allImports: input.imports.filter(currImport => !IMPORT_MODULES_BLACKLIST.includes(cleanupImportPathName(currImport.path))),
        // allMocks: input.imports.filter(currImport => !MOCK_MODULES_BLACKLIST.includes(cleanupImportPathName(currImport.path))),
        allImports: [], allMocks: [], parsedSource: input }, templateOptions);
    const testImports = template((0, fs_1.readFileSync)(`${templateDir}/imports.tpl`).toString())(templateDataMap);
    const testMocks = template((0, fs_1.readFileSync)(`${templateDir}/mocksDefinition.tpl`).toString())(templateDataMap);
    const testClass = template((0, fs_1.readFileSync)(`${templateDir}/classDescribe.tpl`).toString())(templateDataMap);
    const testFunctions = template((0, fs_1.readFileSync)(`${templateDir}/functionsDescribe.tpl`).toString())(templateDataMap);
    const testPojos = template((0, fs_1.readFileSync)(`${templateDir}/pojosDescribe.tpl`).toString())(templateDataMap);
    const testComponents = template((0, fs_1.readFileSync)(`${templateDir}/componentsDescribe.tpl`).toString())(templateDataMap);
    return trimEnd([
        testImports,
        testMocks,
        testClass,
        testComponents,
        testFunctions,
        testPojos,
    ].filter(hasOutput => hasOutput.replace(/(\r|\n)/g, '')).join('\r\n'), '\r\n');
}
exports.generateUnitTest = generateUnitTest;
function determinateUsedQuote(imports) {
    for (const value of imports) {
        if (value.path.match(/['"']/)) {
            return value.path.substring(0, 1);
        }
    }
    return '\'';
}
function applyExportCapitalization(parsedObject, exportName) {
    if ('isFunctional' in parsedObject || 'methods' in parsedObject) {
        const firstLetter = exportName[0];
        return `${firstLetter.toUpperCase()}${exportName.slice(1)}`;
    }
    return exportName;
}
