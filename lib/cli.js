#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const minimist = require("minimist");
const main_1 = require("./main");
const updateVersionBanner_1 = require("./updateVersionBanner");
(0, updateVersionBanner_1.default)();
(0, main_1.run)(minimist(process.argv.slice(2)));
