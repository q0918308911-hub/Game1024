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
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;
const CoreService = __importStar(require("./CoreService"));
const Utils_1 = require("./Utils");
exports.methods = {
    installAllExtensionsDependencies() {
        CoreService.installAllExtensionsDependencies();
    },
    refreshExtensionsDummy() {
        CoreService.refreshExtensionsDummy();
    },
    async createExtension(template, name) {
        await CoreService.createExtension(template, name);
    },
    openExtensionInVscode(assetInfo) {
        CoreService.openExtensionInVscode(assetInfo);
    },
    reloadExtension(assetInfo) {
        CoreService.reloadExtension(assetInfo);
    },
    deleteExtension(assetInfo) {
        CoreService.deleteExtension(assetInfo);
    },
    enableExtension(assetInfo) {
        CoreService.enableExtension(assetInfo);
    },
    disableExtension(assetInfo) {
        CoreService.disableExtension(assetInfo);
    },
    afterReload() {
        CoreService.afterReload();
    },
};
function load() {
    // 避免有插件載入完成時機較晚 導致實際上是啟用 但被標記成禁用 
    (0, Utils_1.waitTime)(1).then(() => {
        CoreService.refreshExtensionsDummy();
    });
}
exports.load = load;
function unload() {
    CoreService.clearExtensionDummy();
}
exports.unload = unload;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkRBQTZDO0FBQzdDLG1DQUFtQztBQUV0QixRQUFBLE9BQU8sR0FBNEM7SUFDNUQsZ0NBQWdDO1FBQzVCLFdBQVcsQ0FBQyxnQ0FBZ0MsRUFBRSxDQUFDO0lBQ25ELENBQUM7SUFDRCxzQkFBc0I7UUFDbEIsV0FBVyxDQUFDLHNCQUFzQixFQUFFLENBQUM7SUFDekMsQ0FBQztJQUNELEtBQUssQ0FBQyxlQUFlLENBQUMsUUFBZ0IsRUFBRSxJQUFZO1FBQ2hELE1BQU0sV0FBVyxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUNELHFCQUFxQixDQUFDLFNBQW9CO1FBQ3RDLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBQ0QsZUFBZSxDQUFDLFNBQW9CO1FBQ2hDLFdBQVcsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUNELGVBQWUsQ0FBQyxTQUFvQjtRQUNoQyxXQUFXLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFDRCxlQUFlLENBQUMsU0FBb0I7UUFDaEMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBQ0QsZ0JBQWdCLENBQUMsU0FBb0I7UUFDakMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFDRCxXQUFXO1FBQ1AsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQzlCLENBQUM7Q0FDSixDQUFDO0FBRUYsU0FBZ0IsSUFBSTtJQUNoQixrQ0FBa0M7SUFDbEMsSUFBQSxnQkFBUSxFQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7UUFDbEIsV0FBVyxDQUFDLHNCQUFzQixFQUFFLENBQUM7SUFDekMsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBTEQsb0JBS0M7QUFFRCxTQUFnQixNQUFNO0lBQ2xCLFdBQVcsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQ3RDLENBQUM7QUFGRCx3QkFFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFzc2V0SW5mbyB9IGZyb20gJ0Bjb2Nvcy9jcmVhdG9yLXR5cGVzL2VkaXRvci9wYWNrYWdlcy9hc3NldC1kYi9AdHlwZXMvcHVibGljJztcbmltcG9ydCAqIGFzIENvcmVTZXJ2aWNlIGZyb20gJy4vQ29yZVNlcnZpY2UnO1xuaW1wb3J0IHsgd2FpdFRpbWUgfSBmcm9tICcuL1V0aWxzJztcblxuZXhwb3J0IGNvbnN0IG1ldGhvZHM6IHsgW2tleTogc3RyaW5nXTogKC4uLmFueTogYW55KSA9PiBhbnkgfSA9IHtcbiAgICBpbnN0YWxsQWxsRXh0ZW5zaW9uc0RlcGVuZGVuY2llcygpIHtcbiAgICAgICAgQ29yZVNlcnZpY2UuaW5zdGFsbEFsbEV4dGVuc2lvbnNEZXBlbmRlbmNpZXMoKTtcbiAgICB9LFxuICAgIHJlZnJlc2hFeHRlbnNpb25zRHVtbXkoKSB7XG4gICAgICAgIENvcmVTZXJ2aWNlLnJlZnJlc2hFeHRlbnNpb25zRHVtbXkoKTtcbiAgICB9LFxuICAgIGFzeW5jIGNyZWF0ZUV4dGVuc2lvbih0ZW1wbGF0ZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgYXdhaXQgQ29yZVNlcnZpY2UuY3JlYXRlRXh0ZW5zaW9uKHRlbXBsYXRlLCBuYW1lKTtcbiAgICB9LFxuICAgIG9wZW5FeHRlbnNpb25JblZzY29kZShhc3NldEluZm86IEFzc2V0SW5mbykge1xuICAgICAgICBDb3JlU2VydmljZS5vcGVuRXh0ZW5zaW9uSW5Wc2NvZGUoYXNzZXRJbmZvKTtcbiAgICB9LFxuICAgIHJlbG9hZEV4dGVuc2lvbihhc3NldEluZm86IEFzc2V0SW5mbykge1xuICAgICAgICBDb3JlU2VydmljZS5yZWxvYWRFeHRlbnNpb24oYXNzZXRJbmZvKTtcbiAgICB9LFxuICAgIGRlbGV0ZUV4dGVuc2lvbihhc3NldEluZm86IEFzc2V0SW5mbykge1xuICAgICAgICBDb3JlU2VydmljZS5kZWxldGVFeHRlbnNpb24oYXNzZXRJbmZvKTtcbiAgICB9LFxuICAgIGVuYWJsZUV4dGVuc2lvbihhc3NldEluZm86IEFzc2V0SW5mbykge1xuICAgICAgICBDb3JlU2VydmljZS5lbmFibGVFeHRlbnNpb24oYXNzZXRJbmZvKTtcbiAgICB9LFxuICAgIGRpc2FibGVFeHRlbnNpb24oYXNzZXRJbmZvOiBBc3NldEluZm8pIHtcbiAgICAgICAgQ29yZVNlcnZpY2UuZGlzYWJsZUV4dGVuc2lvbihhc3NldEluZm8pO1xuICAgIH0sXG4gICAgYWZ0ZXJSZWxvYWQoKSB7XG4gICAgICAgIENvcmVTZXJ2aWNlLmFmdGVyUmVsb2FkKCk7XG4gICAgfSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkKCkge1xuICAgIC8vIOmBv+WFjeacieaPkuS7tui8ieWFpeWujOaIkOaZguapn+i8g+aZmiDlsI7oh7Tlr6bpmpvkuIrmmK/llZ/nlKgg5L2G6KKr5qiZ6KiY5oiQ56aB55SoIFxuICAgIHdhaXRUaW1lKDEpLnRoZW4oKCkgPT4ge1xuICAgICAgICBDb3JlU2VydmljZS5yZWZyZXNoRXh0ZW5zaW9uc0R1bW15KCk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bmxvYWQoKSB7XG4gICAgQ29yZVNlcnZpY2UuY2xlYXJFeHRlbnNpb25EdW1teSgpO1xufSJdfQ==