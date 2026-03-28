"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showLog = showLog;
exports.showWarn = showWarn;
exports.showError = showError;
exports.waitTime = waitTime;
const package_json_1 = __importDefault(require("../package.json"));
function showLog(message) {
    console.log(`[${package_json_1.default.name}]: ${message}`);
}
function showWarn(message) {
    console.warn(`[${package_json_1.default.name}]: ${message}`);
}
function showError(message, error) {
    console.error(`[${package_json_1.default.name}]: ${message}`, ...(error ? [error] : []));
}
async function waitTime(time) {
    return new Promise(resolve => setTimeout(resolve, time * 1000));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2UvVXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFFQSwwQkFFQztBQUVELDRCQUVDO0FBRUQsOEJBRUM7QUFFRCw0QkFFQztBQWhCRCxtRUFBMEM7QUFFMUMsU0FBZ0IsT0FBTyxDQUFDLE9BQWU7SUFDbkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHNCQUFXLENBQUMsSUFBSSxNQUFNLE9BQU8sRUFBRSxDQUFDLENBQUM7QUFDckQsQ0FBQztBQUVELFNBQWdCLFFBQVEsQ0FBQyxPQUFlO0lBQ3BDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxzQkFBVyxDQUFDLElBQUksTUFBTSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FBQ3RELENBQUM7QUFFRCxTQUFnQixTQUFTLENBQUMsT0FBZSxFQUFFLEtBQVc7SUFDbEQsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLHNCQUFXLENBQUMsSUFBSSxNQUFNLE9BQU8sRUFBRSxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDbEYsQ0FBQztBQUVNLEtBQUssVUFBVSxRQUFRLENBQUMsSUFBWTtJQUN2QyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNwRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhY2thZ2VKU09OIGZyb20gJy4uL3BhY2thZ2UuanNvbic7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2hvd0xvZyhtZXNzYWdlOiBzdHJpbmcpIHtcclxuICAgIGNvbnNvbGUubG9nKGBbJHtwYWNrYWdlSlNPTi5uYW1lfV06ICR7bWVzc2FnZX1gKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNob3dXYXJuKG1lc3NhZ2U6IHN0cmluZykge1xyXG4gICAgY29uc29sZS53YXJuKGBbJHtwYWNrYWdlSlNPTi5uYW1lfV06ICR7bWVzc2FnZX1gKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNob3dFcnJvcihtZXNzYWdlOiBzdHJpbmcsIGVycm9yPzogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKGBbJHtwYWNrYWdlSlNPTi5uYW1lfV06ICR7bWVzc2FnZX1gLCAuLi4oZXJyb3IgPyBbZXJyb3JdIDogW10pKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdhaXRUaW1lKHRpbWU6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCB0aW1lICogMTAwMCkpO1xyXG59Il19