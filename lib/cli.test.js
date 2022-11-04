"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const updateVersionBanner_1 = require("./updateVersionBanner");
const main_1 = require("./main");
require("./cli");
jest.mock('./updateVersionBanner', () => ({
    default: jest.fn(),
    __esModule: true
}));
jest.mock('./main', () => ({
    run: jest.fn(),
}));
describe('cli', () => {
    it('should checkForUpdates and invoke main entrypoint', () => {
        expect(updateVersionBanner_1.default).toHaveBeenCalled();
        expect(main_1.run).toHaveBeenCalled();
    });
});
