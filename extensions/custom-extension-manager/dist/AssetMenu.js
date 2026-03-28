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
exports.onAssetMenu = void 0;
const package_json_1 = __importDefault(require("../package.json"));
const CoreService = __importStar(require("./CoreService"));
function onAssetMenu(assetInfo) {
    const subMenuItems = [];
    if (assetInfo.url === `db://${package_json_1.default.name}/${package_json_1.default.name}`) {
        subMenuItems.push(createMenuItem('創建插件', () => {
            Editor.Panel.open(package_json_1.default.name);
        }));
        subMenuItems.push(createMenuItem('安裝所有插件的依賴套件', () => {
            Editor.Message.send(package_json_1.default.name, 'install-all-extensions-dependencies');
        }));
        subMenuItems.push(createMenuItem('刷新插件列表', () => {
            Editor.Message.send(package_json_1.default.name, 'refresh-extensions-dummy');
        }));
        subMenuItems.push(createMenuItem('重新載入此插件', () => {
            Editor.Message.send(package_json_1.default.name, 'reload-extension', assetInfo);
        }));
        return [
            {
                label: '插件工具',
                submenu: subMenuItems,
            },
        ];
    }
    if (assetInfo.url.startsWith(`db://${package_json_1.default.name}/${package_json_1.default.name}/`)) {
        const subMenuItems = [];
        subMenuItems.push(createMenuItem('在 vscode 開啟插件', () => {
            Editor.Message.send(package_json_1.default.name, 'open-extension-in-vscode', assetInfo);
        }));
        subMenuItems.push(createMenuItem('重新載入此插件', () => {
            Editor.Message.send(package_json_1.default.name, 'reload-extension', assetInfo);
        }));
        subMenuItems.push(createMenuItem('刪除此插件', () => {
            Editor.Message.send(package_json_1.default.name, 'delete-extension', assetInfo);
        }));
        const cleanName = CoreService.getDummyCleanName(assetInfo);
        const extensionInfo = Editor.Package.getPackages().find(pkg => pkg.name === cleanName);
        if (extensionInfo) {
            const label = extensionInfo.enable ? '禁用此插件' : '啟用此插件';
            const message = extensionInfo.enable ? 'disable-extension' : 'enable-extension';
            subMenuItems.push(createMenuItem(label, () => {
                Editor.Message.send(package_json_1.default.name, message, assetInfo);
            }));
        }
        return [
            {
                label: '插件工具',
                submenu: subMenuItems,
            },
        ];
    }
    return [];
}
exports.onAssetMenu = onAssetMenu;
;
function createMenuItem(label, clickCallback) {
    return {
        label,
        click() {
            clickCallback();
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXNzZXRNZW51LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc291cmNlL0Fzc2V0TWVudS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLG1FQUEwQztBQUMxQywyREFBNkM7QUFFN0MsU0FBZ0IsV0FBVyxDQUFDLFNBQW9CO0lBQzVDLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQztJQUN4QixJQUFJLFNBQVMsQ0FBQyxHQUFHLEtBQUssUUFBUSxzQkFBVyxDQUFDLElBQUksSUFBSSxzQkFBVyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUM7UUFDbkUsWUFBWSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtZQUMxQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxzQkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDSixZQUFZLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO1lBQ2pELE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHNCQUFXLENBQUMsSUFBSSxFQUFFLHFDQUFxQyxDQUFDLENBQUM7UUFDakYsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNKLFlBQVksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7WUFDNUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0JBQVcsQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztRQUN0RSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0osWUFBWSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtZQUM3QyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxzQkFBVyxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN6RSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0osT0FBTztZQUNIO2dCQUNJLEtBQUssRUFBRSxNQUFNO2dCQUNiLE9BQU8sRUFBRSxZQUFZO2FBQ3hCO1NBQ0osQ0FBQztJQUNOLENBQUM7SUFDRCxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsc0JBQVcsQ0FBQyxJQUFJLElBQUksc0JBQVcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDNUUsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDO1FBQ3hCLFlBQVksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7WUFDbkQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0JBQVcsQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDakYsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNKLFlBQVksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7WUFDN0MsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0JBQVcsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDekUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNKLFlBQVksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7WUFDM0MsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0JBQVcsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDekUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVKLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMzRCxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLENBQUM7UUFDdkYsSUFBSSxhQUFhLEVBQUUsQ0FBQztZQUNoQixNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztZQUN2RCxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUM7WUFDaEYsWUFBWSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRTtnQkFDekMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0JBQVcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzlELENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDUixDQUFDO1FBQ0QsT0FBTztZQUNIO2dCQUNJLEtBQUssRUFBRSxNQUFNO2dCQUNiLE9BQU8sRUFBRSxZQUFZO2FBQ3hCO1NBQ0osQ0FBQztJQUNOLENBQUM7SUFDRCxPQUFPLEVBQUUsQ0FBQztBQUNkLENBQUM7QUFuREQsa0NBbURDO0FBQUEsQ0FBQztBQUVGLFNBQVMsY0FBYyxDQUFDLEtBQWEsRUFBRSxhQUF5QjtJQUM1RCxPQUFPO1FBQ0gsS0FBSztRQUNMLEtBQUs7WUFDRCxhQUFhLEVBQUUsQ0FBQztRQUNwQixDQUFDO0tBQ0osQ0FBQztBQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuaW1wb3J0IHsgQXNzZXRJbmZvIH0gZnJvbSAnQGNvY29zL2NyZWF0b3ItdHlwZXMvZWRpdG9yL3BhY2thZ2VzL2Fzc2V0LWRiL0B0eXBlcy9wdWJsaWMnO1xyXG5pbXBvcnQgcGFja2FnZUpTT04gZnJvbSAnLi4vcGFja2FnZS5qc29uJztcclxuaW1wb3J0ICogYXMgQ29yZVNlcnZpY2UgZnJvbSAnLi9Db3JlU2VydmljZSc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gb25Bc3NldE1lbnUoYXNzZXRJbmZvOiBBc3NldEluZm8pIHtcclxuICAgIGNvbnN0IHN1Yk1lbnVJdGVtcyA9IFtdO1xyXG4gICAgaWYgKGFzc2V0SW5mby51cmwgPT09IGBkYjovLyR7cGFja2FnZUpTT04ubmFtZX0vJHtwYWNrYWdlSlNPTi5uYW1lfWApIHtcclxuICAgICAgICBzdWJNZW51SXRlbXMucHVzaChjcmVhdGVNZW51SXRlbSgn5Ym15bu65o+S5Lu2JywgKCkgPT4ge1xyXG4gICAgICAgICAgICBFZGl0b3IuUGFuZWwub3BlbihwYWNrYWdlSlNPTi5uYW1lKTtcclxuICAgICAgICB9KSk7XHJcbiAgICAgICAgc3ViTWVudUl0ZW1zLnB1c2goY3JlYXRlTWVudUl0ZW0oJ+WuieijneaJgOacieaPkuS7tueahOS+neiztOWll+S7ticsICgpID0+IHtcclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZChwYWNrYWdlSlNPTi5uYW1lLCAnaW5zdGFsbC1hbGwtZXh0ZW5zaW9ucy1kZXBlbmRlbmNpZXMnKTtcclxuICAgICAgICB9KSk7XHJcbiAgICAgICAgc3ViTWVudUl0ZW1zLnB1c2goY3JlYXRlTWVudUl0ZW0oJ+WIt+aWsOaPkuS7tuWIl+ihqCcsICgpID0+IHtcclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZChwYWNrYWdlSlNPTi5uYW1lLCAncmVmcmVzaC1leHRlbnNpb25zLWR1bW15Jyk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgICAgIHN1Yk1lbnVJdGVtcy5wdXNoKGNyZWF0ZU1lbnVJdGVtKCfph43mlrDovInlhaXmraTmj5Lku7YnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQocGFja2FnZUpTT04ubmFtZSwgJ3JlbG9hZC1leHRlbnNpb24nLCBhc3NldEluZm8pO1xyXG4gICAgICAgIH0pKTtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsYWJlbDogJ+aPkuS7tuW3peWFtycsXHJcbiAgICAgICAgICAgICAgICBzdWJtZW51OiBzdWJNZW51SXRlbXMsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgXTtcclxuICAgIH1cclxuICAgIGlmIChhc3NldEluZm8udXJsLnN0YXJ0c1dpdGgoYGRiOi8vJHtwYWNrYWdlSlNPTi5uYW1lfS8ke3BhY2thZ2VKU09OLm5hbWV9L2ApKSB7XHJcbiAgICAgICAgY29uc3Qgc3ViTWVudUl0ZW1zID0gW107XHJcbiAgICAgICAgc3ViTWVudUl0ZW1zLnB1c2goY3JlYXRlTWVudUl0ZW0oJ+WcqCB2c2NvZGUg6ZaL5ZWf5o+S5Lu2JywgKCkgPT4ge1xyXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKHBhY2thZ2VKU09OLm5hbWUsICdvcGVuLWV4dGVuc2lvbi1pbi12c2NvZGUnLCBhc3NldEluZm8pO1xyXG4gICAgICAgIH0pKTtcclxuICAgICAgICBzdWJNZW51SXRlbXMucHVzaChjcmVhdGVNZW51SXRlbSgn6YeN5paw6LyJ5YWl5q2k5o+S5Lu2JywgKCkgPT4ge1xyXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKHBhY2thZ2VKU09OLm5hbWUsICdyZWxvYWQtZXh0ZW5zaW9uJywgYXNzZXRJbmZvKTtcclxuICAgICAgICB9KSk7XHJcbiAgICAgICAgc3ViTWVudUl0ZW1zLnB1c2goY3JlYXRlTWVudUl0ZW0oJ+WIqumZpOatpOaPkuS7ticsICgpID0+IHtcclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZChwYWNrYWdlSlNPTi5uYW1lLCAnZGVsZXRlLWV4dGVuc2lvbicsIGFzc2V0SW5mbyk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjb25zdCBjbGVhbk5hbWUgPSBDb3JlU2VydmljZS5nZXREdW1teUNsZWFuTmFtZShhc3NldEluZm8pO1xyXG4gICAgICAgIGNvbnN0IGV4dGVuc2lvbkluZm8gPSBFZGl0b3IuUGFja2FnZS5nZXRQYWNrYWdlcygpLmZpbmQocGtnID0+IHBrZy5uYW1lID09PSBjbGVhbk5hbWUpO1xyXG4gICAgICAgIGlmIChleHRlbnNpb25JbmZvKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGxhYmVsID0gZXh0ZW5zaW9uSW5mby5lbmFibGUgPyAn56aB55So5q2k5o+S5Lu2JyA6ICfllZ/nlKjmraTmj5Lku7YnO1xyXG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gZXh0ZW5zaW9uSW5mby5lbmFibGUgPyAnZGlzYWJsZS1leHRlbnNpb24nIDogJ2VuYWJsZS1leHRlbnNpb24nO1xyXG4gICAgICAgICAgICBzdWJNZW51SXRlbXMucHVzaChjcmVhdGVNZW51SXRlbShsYWJlbCwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZChwYWNrYWdlSlNPTi5uYW1lLCBtZXNzYWdlLCBhc3NldEluZm8pO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxhYmVsOiAn5o+S5Lu25bel5YW3JyxcclxuICAgICAgICAgICAgICAgIHN1Ym1lbnU6IHN1Yk1lbnVJdGVtcyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFtdO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlTWVudUl0ZW0obGFiZWw6IHN0cmluZywgY2xpY2tDYWxsYmFjazogKCkgPT4gdm9pZCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBsYWJlbCxcclxuICAgICAgICBjbGljaygpIHtcclxuICAgICAgICAgICAgY2xpY2tDYWxsYmFjaygpO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59Il19