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
exports.waitTime = exports.showError = exports.showWarn = exports.showLog = void 0;
const packageJSON = require('../package.json');
function showLog(message) {
    console.log(`[${packageJSON.name}]: ${message}`);
}
exports.showLog = showLog;
function showWarn(message) {
    console.warn(`[${packageJSON.name}]: ${message}`);
}
exports.showWarn = showWarn;
function showError(message, error) {
    console.error(`[${packageJSON.name}]: ${message}`, ...(error ? [error] : []));
}
exports.showError = showError;
function waitTime(time) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, time * 1000));
    });
}
exports.waitTime = waitTime;
