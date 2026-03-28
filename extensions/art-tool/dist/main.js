"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;
// @ts-ignore
const package_json_1 = __importDefault(require("../package.json"));
const CoreService = __importStar(require("./CoreService"));
const ctx = {
    prefabInfos: [],
    currentIndex: 0,
    result: [],
    isCheckMask: false,
};
exports.methods = {
    openPanel() {
        Editor.Panel.open(package_json_1.default.name);
    },
    async convertPrefab(targetFolder) {
        await CoreService.convertPrefab(ctx, targetFolder);
    },
    afterReload() {
        CoreService.afterReload();
    },
    async openCurrentPrefab() {
        await CoreService.openCurrentPrefab(ctx);
    },
    async sceneReady(assetUUID) {
        await CoreService.sceneReady(ctx, assetUUID);
    },
};
/**
 * @en Method Triggered on Extension Startup
 * @zh 扩展启动时触发的方法
 */
function load() { }
exports.load = load;
/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展时触发的方法
 */
function unload() { }
exports.unload = unload;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsYUFBYTtBQUNiLG1FQUEwQztBQUMxQywyREFBNEM7QUFHNUMsTUFBTSxHQUFHLEdBQXNCO0lBQzNCLFdBQVcsRUFBRSxFQUFFO0lBQ2YsWUFBWSxFQUFFLENBQUM7SUFDZixNQUFNLEVBQUUsRUFBRTtJQUNWLFdBQVcsRUFBRSxLQUFLO0NBQ3JCLENBQUM7QUFFVyxRQUFBLE9BQU8sR0FBNEM7SUFDNUQsU0FBUztRQUNMLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLHNCQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsWUFBc0I7UUFDdEMsTUFBTSxXQUFXLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRUQsV0FBVztRQUNQLFdBQVcsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUM5QixDQUFDO0lBRUQsS0FBSyxDQUFDLGlCQUFpQjtRQUNuQixNQUFNLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFpQjtRQUM5QixNQUFNLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ2pELENBQUM7Q0FDSixDQUFDO0FBSUY7OztHQUdHO0FBQ0gsU0FBZ0IsSUFBSSxLQUFLLENBQUM7QUFBMUIsb0JBQTBCO0FBRTFCOzs7R0FHRztBQUNILFNBQWdCLE1BQU0sS0FBSyxDQUFDO0FBQTVCLHdCQUE0QiIsInNvdXJjZXNDb250ZW50IjpbIi8vIEB0cy1pZ25vcmVcbmltcG9ydCBwYWNrYWdlSlNPTiBmcm9tICcuLi9wYWNrYWdlLmpzb24nO1xuaW1wb3J0ICogYXMgQ29yZVNlcnZpY2UgZnJvbSAnLi9Db3JlU2VydmljZSdcbmltcG9ydCB7IFByZWZhYlNjYW5Db250ZXh0IH0gZnJvbSAnLi9pbnRlcmZhY2UnO1xuXG5jb25zdCBjdHg6IFByZWZhYlNjYW5Db250ZXh0ID0ge1xuICAgIHByZWZhYkluZm9zOiBbXSxcbiAgICBjdXJyZW50SW5kZXg6IDAsXG4gICAgcmVzdWx0OiBbXSxcbiAgICBpc0NoZWNrTWFzazogZmFsc2UsXG59O1xuXG5leHBvcnQgY29uc3QgbWV0aG9kczogeyBba2V5OiBzdHJpbmddOiAoLi4uYW55OiBhbnkpID0+IGFueSB9ID0ge1xuICAgIG9wZW5QYW5lbCgpIHtcbiAgICAgICAgRWRpdG9yLlBhbmVsLm9wZW4ocGFja2FnZUpTT04ubmFtZSk7XG4gICAgfSxcblxuICAgIGFzeW5jIGNvbnZlcnRQcmVmYWIodGFyZ2V0Rm9sZGVyOiBzdHJpbmdbXSkge1xuICAgICAgICBhd2FpdCBDb3JlU2VydmljZS5jb252ZXJ0UHJlZmFiKGN0eCwgdGFyZ2V0Rm9sZGVyKTtcbiAgICB9LFxuXG4gICAgYWZ0ZXJSZWxvYWQoKSB7XG4gICAgICAgIENvcmVTZXJ2aWNlLmFmdGVyUmVsb2FkKCk7XG4gICAgfSxcblxuICAgIGFzeW5jIG9wZW5DdXJyZW50UHJlZmFiKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBDb3JlU2VydmljZS5vcGVuQ3VycmVudFByZWZhYihjdHgpO1xuICAgIH0sXG5cbiAgICBhc3luYyBzY2VuZVJlYWR5KGFzc2V0VVVJRDogc3RyaW5nKSB7XG4gICAgICAgIGF3YWl0IENvcmVTZXJ2aWNlLnNjZW5lUmVhZHkoY3R4LCBhc3NldFVVSUQpO1xuICAgIH0sXG59O1xuXG5cblxuLyoqXG4gKiBAZW4gTWV0aG9kIFRyaWdnZXJlZCBvbiBFeHRlbnNpb24gU3RhcnR1cFxuICogQHpoIOaJqeWxleWQr+WKqOaXtuinpuWPkeeahOaWueazlVxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZCgpIHsgfVxuXG4vKipcbiAqIEBlbiBNZXRob2QgdHJpZ2dlcmVkIHdoZW4gdW5pbnN0YWxsaW5nIHRoZSBleHRlbnNpb25cbiAqIEB6aCDljbjovb3mianlsZXml7bop6blj5HnmoTmlrnms5VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVubG9hZCgpIHsgfVxuIl19