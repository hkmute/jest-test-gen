"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const latest_version_1 = require("latest-version");
const fs_1 = require("fs");
const compare_versions_1 = require("compare-versions");
function checkVersionAndShowUpdateBanner() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const remoteVersion = yield (0, latest_version_1.default)('jest-test-gen');
            const version = JSON.parse((0, fs_1.readFileSync)(`${__dirname}/../package.json`, 'utf-8')).version;
            if ((0, compare_versions_1.compare)(remoteVersion, version, '>')) {
                console.warn('🎉 A new version of the cli is available! TO UPDATE: npm install -g jest-test-gen 🎉');
            }
        }
        catch (err) {
            console.warn('check for updates failed :( Please check at https://www.npmjs.com/package/jest-test-gen');
        }
    });
}
exports.default = checkVersionAndShowUpdateBanner;
