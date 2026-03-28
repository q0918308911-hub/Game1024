"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitTime = exports.showError = exports.showWarn = exports.showLog = void 0;
const package_json_1 = __importDefault(require("../package.json"));
function showLog(message) {
    console.log(`[${package_json_1.default.name}]: ${message}`);
}
exports.showLog = showLog;
function showWarn(message) {
    console.warn(`[${package_json_1.default.name}]: ${message}`);
}
exports.showWarn = showWarn;
function showError(message, error) {
    console.error(`[${package_json_1.default.name}]: ${message}`, ...(error ? [error] : []));
}
exports.showError = showError;
async function waitTime(time) {
    return new Promise(resolve => setTimeout(resolve, time * 1000));
}
exports.waitTime = waitTime;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvVXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsbUVBQTBDO0FBRTFDLFNBQWdCLE9BQU8sQ0FBQyxPQUFlO0lBQ25DLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxzQkFBVyxDQUFDLElBQUksTUFBTSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FBQ3JELENBQUM7QUFGRCwwQkFFQztBQUVELFNBQWdCLFFBQVEsQ0FBQyxPQUFlO0lBQ3BDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxzQkFBVyxDQUFDLElBQUksTUFBTSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FBQ3RELENBQUM7QUFGRCw0QkFFQztBQUVELFNBQWdCLFNBQVMsQ0FBQyxPQUFlLEVBQUUsS0FBVztJQUNsRCxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksc0JBQVcsQ0FBQyxJQUFJLE1BQU0sT0FBTyxFQUFFLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNsRixDQUFDO0FBRkQsOEJBRUM7QUFFTSxLQUFLLFVBQVUsUUFBUSxDQUFDLElBQVk7SUFDdkMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDcEUsQ0FBQztBQUZELDRCQUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhY2thZ2VKU09OIGZyb20gJy4uL3BhY2thZ2UuanNvbic7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2hvd0xvZyhtZXNzYWdlOiBzdHJpbmcpIHtcclxuICAgIGNvbnNvbGUubG9nKGBbJHtwYWNrYWdlSlNPTi5uYW1lfV06ICR7bWVzc2FnZX1gKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNob3dXYXJuKG1lc3NhZ2U6IHN0cmluZykge1xyXG4gICAgY29uc29sZS53YXJuKGBbJHtwYWNrYWdlSlNPTi5uYW1lfV06ICR7bWVzc2FnZX1gKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNob3dFcnJvcihtZXNzYWdlOiBzdHJpbmcsIGVycm9yPzogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKGBbJHtwYWNrYWdlSlNPTi5uYW1lfV06ICR7bWVzc2FnZX1gLCAuLi4oZXJyb3IgPyBbZXJyb3JdIDogW10pKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdhaXRUaW1lKHRpbWU6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCB0aW1lICogMTAwMCkpO1xyXG59Il19