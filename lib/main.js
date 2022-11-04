"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const fs_1 = require("fs");
const path = require("path");
const os = require("os");
const ts = require("typescript");
const parse_source_file_1 = require("./parse-source-file");
const generate_unit_test_1 = require("./generate-unit-test");
function run(args, opts) {
    if (!args._.length) {
        // tslint:disable-next-line:no-console
        console.error('missing path argument');
        console.error('USAGE: jest-test-gen <path-to-file> --outputDir ./my/custom/output');
        process.exit(1);
    }
    const inputPath = args._[0];
    const inputFileExtension = path.extname(inputPath);
    const inputFilenameNoExt = path.basename(inputPath, inputFileExtension);
    let finalOutputDir = path.dirname(inputPath);
    if (args.outputDir) {
        const homeDir = os.homedir();
        const resolvedConfigOutputDir = args.outputDir.replace(/^~(?=$|\/|\\)/, homeDir);
        if (path.isAbsolute(resolvedConfigOutputDir)) {
            finalOutputDir = resolvedConfigOutputDir;
        }
        else {
            finalOutputDir = path.resolve(finalOutputDir, args.outputDir);
        }
    }
    const specFileName = path.join(finalOutputDir, `${inputFilenameNoExt}.generated.test${inputFileExtension}`);
    const sourceCode = (0, fs_1.readFileSync)(inputPath).toString();
    const sourceFile = ts.createSourceFile(inputPath, sourceCode, ts.ScriptTarget.Latest, true);
    const input = (0, parse_source_file_1.parseSourceFile)(sourceFile);
    const output = (0, generate_unit_test_1.generateUnitTest)(inputPath, sourceCode, input);
    if (opts === null || opts === void 0 ? void 0 : opts.returnOutput) {
        return output;
    }
    console.log('Writing generated test file: ', specFileName);
    (0, fs_1.writeFileSync)(specFileName, output);
    return specFileName;
}
exports.run = run;
