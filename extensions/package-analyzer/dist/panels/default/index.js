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
const fs_1 = require("fs");
const path_1 = require("path");
const CoreService = __importStar(require("../../CoreService"));
/**
 * @zh 如果希望兼容 3.3 之前的版本可以使用下方的代码
 * @en You can add the code below if you want compatibility with versions prior to 3.3
 */
// Editor.Panel.define = Editor.Panel.define || function(options: any) { return options }
module.exports = Editor.Panel.define({
    listeners: {},
    template: (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        comboBuild: '#comboBuild',
        labelTotal: '#labelTotal',
        labelBasePath: '#labelBasePath',
        tree: '#tree',
    },
    methods: {
        /**
         * 更新包體列表選單
         */
        setPackageList() {
            CoreService.getAllPackageSelection();
            if (this.$.comboBuild) {
                const comboBuild = this.$.comboBuild;
                const tempSelection = CoreService.getAllPackageSelection();
                comboBuild.options.length = 1;
                tempSelection.forEach((folderName) => {
                    const option = document.createElement("option");
                    option.value = folderName;
                    option.textContent = folderName;
                    comboBuild.appendChild(option);
                });
                comboBuild.addEventListener("change", () => {
                    const selected = comboBuild.value;
                    this.showFilesInPackage(selected);
                    CoreService.getAllFileInPackage(selected);
                });
            }
        },
        /**
         * 顯示包體檔案到 tree view
         * @param packageName 包體名稱
         */
        showFilesInPackage(packageName) {
            const treeDiv = this.$.tree;
            const labelTotal = this.$.labelTotal;
            const labelBasePath = this.$.labelBasePath;
            // 1. 清空 UI
            treeDiv.innerHTML = '';
            labelTotal.textContent = '總檔案大小: ';
            labelBasePath.textContent = '包體路徑: ';
            // 2. 讀包體的 config.json
            CoreService.setConfigJson(packageName);
            // 3. 取得包體的所有檔案
            const fileDict = CoreService.getAllFileInPackage(packageName);
            // 4. 計算總大小
            let totalSize = 0;
            fileDict.forEach((fileGroup, ext) => {
                totalSize += fileGroup.totalSize;
            });
            // 5. 顯示所有檔案到 tree view
            fileDict.forEach((fileGroup, ext) => {
                const extSize = fileGroup.totalSize;
                const percent = (extSize / totalSize * 100).toFixed(2);
                // 分類節點
                const parentNode = document.createElement('div');
                parentNode.className = 'tree-parent';
                parentNode.textContent = `[${ext}] ${CoreService.formatBytes(extSize)} (${percent}%)`;
                treeDiv.appendChild(parentNode);
                // 單一檔案節點 Container
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'tree-children';
                parentNode.appendChild(childrenContainer);
                // 單一檔案節點
                fileGroup.fileInfos
                    .sort((a, b) => b.size - a.size)
                    .forEach((file) => {
                    const childNode = document.createElement('div');
                    const path = CoreService.getRelativePath(file.path);
                    childNode.className = 'tree-child';
                    childNode.textContent = `(${CoreService.formatBytes(file.size)}) ${path}`;
                    childrenContainer.appendChild(childNode);
                    childNode.addEventListener('click', (event) => {
                        // 阻止冒泡到 parentNode
                        event.stopPropagation();
                        // 清除其他 childNode 的高亮
                        const allChildren = treeDiv.querySelectorAll('.tree-child');
                        allChildren.forEach(node => node.classList.remove('selected'));
                        // 標記自己為選中
                        childNode.classList.add('selected');
                        // 執行選中操作
                        CoreService.selectFile(path);
                    });
                });
                // 初始收合
                childrenContainer.style.display = 'none';
                parentNode.addEventListener('click', () => {
                    childrenContainer.style.display = childrenContainer.style.display === 'none' ? 'block' : 'none';
                });
            });
            labelTotal.textContent = `總檔案大小: ${CoreService.formatBytes(totalSize)}`;
            labelBasePath.textContent = `包體路徑: ${packageName}`;
        },
    },
    ready() {
        this.setPackageList();
    },
    beforeClose() { },
    close() { },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL2RlZmF1bHQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJCQUFrQztBQUNsQywrQkFBNEI7QUFDNUIsK0RBQWlEO0FBRWpEOzs7R0FHRztBQUNILHlGQUF5RjtBQUN6RixNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQ2pDLFNBQVMsRUFBRSxFQUFFO0lBQ2IsUUFBUSxFQUFFLElBQUEsaUJBQVksRUFBQyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsNkNBQTZDLENBQUMsRUFBRSxPQUFPLENBQUM7SUFDL0YsS0FBSyxFQUFFLElBQUEsaUJBQVksRUFBQyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUseUNBQXlDLENBQUMsRUFBRSxPQUFPLENBQUM7SUFDeEYsQ0FBQyxFQUFFO1FBQ0MsVUFBVSxFQUFFLGFBQWE7UUFDekIsVUFBVSxFQUFFLGFBQWE7UUFDekIsYUFBYSxFQUFFLGdCQUFnQjtRQUMvQixJQUFJLEVBQUUsT0FBTztLQUNoQjtJQUNELE9BQU8sRUFBRTtRQUNMOztXQUVHO1FBQ0gsY0FBYztZQUNWLFdBQVcsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1lBQ3JDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDcEIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUErQixDQUFDO2dCQUMxRCxNQUFNLGFBQWEsR0FBRyxXQUFXLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztnQkFFM0QsVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUU5QixhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUU7b0JBQ2pDLE1BQU0sTUFBTSxHQUFHLFFBQVEs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Q0FBQyxDQUFDO1lBQ1AsQ0FBQyxDQUFDLENBQUM7WUFFSCxVQUFVLENBQUMsV0FBVyxHQUFHLFVBQVUsV0FBVyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1lBQ3hFLGFBQWEsQ0FBQyxXQUFXLEdBQUcsU0FBUyxXQUFXLEVBQUUsQ0FBQztRQUN2RCxDQUFDO0tBQ0o7SUFDRCxLQUFLO1FBQ0QsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQzFCLENBQUM7SUFDRCxXQUFXLEtBQUssQ0FBQztJQUNqQixLQUFLLEtBQUssQ0FBQztDQUNkLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcclxuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgKiBhcyBDb3JlU2VydmljZSBmcm9tICcuLi8uLi9Db3JlU2VydmljZSc7XHJcbmltcG9ydCB7IEZpbGVHcm91cCB9IGZyb20gJy4uLy4uL0ZpbGVHcm91cCc7XHJcbi8qKlxyXG4gKiBAemgg5aaC5p6c5biM5pyb5YW85a65IDMuMyDkuYvliY3nmoTniYjmnKzlj6/ku6Xkvb/nlKjkuIvmlrnnmoTku6PnoIFcclxuICogQGVuIFlvdSBjYW4gYWRkIHRoZSBjb2RlIGJlbG93IGlmIHlvdSB3YW50IGNvbXBhdGliaWxpdHkgd2l0aCB2ZXJzaW9ucyBwcmlvciB0byAzLjNcclxuICovXHJcbi8vIEVkaXRvci5QYW5lbC5kZWZpbmUgPSBFZGl0b3IuUGFuZWwuZGVmaW5lIHx8IGZ1bmN0aW9uKG9wdGlvbnM6IGFueSkgeyByZXR1cm4gb3B0aW9ucyB9XHJcbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yLlBhbmVsLmRlZmluZSh7XHJcbiAgICBsaXN0ZW5lcnM6IHt9LFxyXG4gICAgdGVtcGxhdGU6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL3N0YXRpYy90ZW1wbGF0ZS9kZWZhdWx0L2luZGV4Lmh0bWwnKSwgJ3V0Zi04JyksXHJcbiAgICBzdHlsZTogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vc3RhdGljL3N0eWxlL2RlZmF1bHQvaW5kZXguY3NzJyksICd1dGYtOCcpLFxyXG4gICAgJDoge1xyXG4gICAgICAgIGNvbWJvQnVpbGQ6ICcjY29tYm9CdWlsZCcsXHJcbiAgICAgICAgbGFiZWxUb3RhbDogJyNsYWJlbFRvdGFsJyxcclxuICAgICAgICBsYWJlbEJhc2VQYXRoOiAnI2xhYmVsQmFzZVBhdGgnLFxyXG4gICAgICAgIHRyZWU6ICcjdHJlZScsXHJcbiAgICB9LFxyXG4gICAgbWV0aG9kczoge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOabtOaWsOWMhemrlOWIl+ihqOmBuOWWrlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNldFBhY2thZ2VMaXN0KCkge1xyXG4gICAgICAgICAgICBDb3JlU2VydmljZS5nZXRBbGxQYWNrYWdlU2VsZWN0aW9uKCk7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLiQuY29tYm9CdWlsZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY29tYm9CdWlsZCA9IHRoaXMuJC5jb21ib0J1aWxkIGFzIEhUTUxTZWxlY3RFbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGVtcFNlbGVjdGlvbiA9IENvcmVTZXJ2aWNlLmdldEFsbFBhY2thZ2VTZWxlY3Rpb24oKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb21ib0J1aWxkLm9wdGlvbnMubGVuZ3RoID0gMTtcclxuXHJcbiAgICAgICAgICAgICAgICB0ZW1wU2VsZWN0aW9uLmZvckVhY2goKGZvbGRlck5hbWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib3B0aW9uXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi52YWx1ZSA9IGZvbGRlck5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnRleHRDb250ZW50ID0gZm9sZGVyTmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBjb21ib0J1aWxkLmFwcGVuZENoaWxkKG9wdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb21ib0J1aWxkLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkID0gY29tYm9CdWlsZC52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dGaWxlc0luUGFja2FnZShzZWxlY3RlZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgQ29yZVNlcnZpY2UuZ2V0QWxsRmlsZUluUGFja2FnZShzZWxlY3RlZCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOmhr+ekuuWMhemrlOaqlOahiOWIsCB0cmVlIHZpZXdcclxuICAgICAgICAgKiBAcGFyYW0gcGFja2FnZU5hbWUg5YyF6auU5ZCN56ixXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2hvd0ZpbGVzSW5QYWNrYWdlKHBhY2thZ2VOYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgY29uc3QgdHJlZURpdiA9IHRoaXMuJC50cmVlIGFzIEhUTUxFbGVtZW50O1xyXG4gICAgICAgICAgICBjb25zdCBsYWJlbFRvdGFsID0gdGhpcy4kLmxhYmVsVG90YWwgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcclxuICAgICAgICAgICAgY29uc3QgbGFiZWxCYXNlUGF0aCA9IHRoaXMuJC5sYWJlbEJhc2VQYXRoIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQ7XHJcblxyXG4gICAgICAgICAgICAvLyAxLiDmuIXnqbogVUlcclxuICAgICAgICAgICAgdHJlZURpdi5pbm5lckhUTUwgPSAnJztcclxuICAgICAgICAgICAgbGFiZWxUb3RhbC50ZXh0Q29udGVudCA9ICfnuL3mqpTmoYjlpKflsI86ICc7XHJcbiAgICAgICAgICAgIGxhYmVsQmFzZVBhdGgudGV4dENvbnRlbnQgPSAn5YyF6auU6Lev5b6ROiAnO1xyXG5cclxuICAgICAgICAgICAgLy8gMi4g6K6A5YyF6auU55qEIGNvbmZpZy5qc29uXHJcbiAgICAgICAgICAgIENvcmVTZXJ2aWNlLnNldENvbmZpZ0pzb24ocGFja2FnZU5hbWUpO1xyXG5cclxuICAgICAgICAgICAgLy8gMy4g5Y+W5b6X5YyF6auU55qE5omA5pyJ5qqU5qGIXHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVEaWN0OiBNYXA8c3RyaW5nLCBGaWxlR3JvdXA+ID0gQ29yZVNlcnZpY2UuZ2V0QWxsRmlsZUluUGFja2FnZShwYWNrYWdlTmFtZSk7XHJcblxyXG4gICAgICAgICAgICAvLyA0LiDoqIjnrpfnuL3lpKflsI9cclxuICAgICAgICAgICAgbGV0IHRvdGFsU2l6ZSA9IDA7XHJcbiAgICAgICAgICAgIGZpbGVEaWN0LmZvckVhY2goKGZpbGVHcm91cCwgZXh0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0b3RhbFNpemUgKz0gZmlsZUdyb3VwLnRvdGFsU2l6ZTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyA1LiDpoa/npLrmiYDmnInmqpTmoYjliLAgdHJlZSB2aWV3XHJcbiAgICAgICAgICAgIGZpbGVEaWN0LmZvckVhY2goKGZpbGVHcm91cCwgZXh0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBleHRTaXplID0gZmlsZUdyb3VwLnRvdGFsU2l6ZTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBlcmNlbnQgPSAoZXh0U2l6ZSAvIHRvdGFsU2l6ZSAqIDEwMCkudG9GaXhlZCgyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyDliIbpoZ7nr4Dpu55cclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgICAgIHBhcmVudE5vZGUuY2xhc3NOYW1lID0gJ3RyZWUtcGFyZW50JztcclxuICAgICAgICAgICAgICAgIHBhcmVudE5vZGUudGV4dENvbnRlbnQgPSBgWyR7ZXh0fV0gJHtDb3JlU2VydmljZS5mb3JtYXRCeXRlcyhleHRTaXplKX0gKCR7cGVyY2VudH0lKWA7XHJcbiAgICAgICAgICAgICAgICB0cmVlRGl2LmFwcGVuZENoaWxkKHBhcmVudE5vZGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIOWWruS4gOaqlOahiOevgOm7niBDb250YWluZXJcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkcmVuQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgICAgICBjaGlsZHJlbkNvbnRhaW5lci5jbGFzc05hbWUgPSAndHJlZS1jaGlsZHJlbic7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnROb2RlLmFwcGVuZENoaWxkKGNoaWxkcmVuQ29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyDllq7kuIDmqpTmoYjnr4Dpu55cclxuICAgICAgICAgICAgICAgIGZpbGVHcm91cC5maWxlSW5mb3NcclxuICAgICAgICAgICAgICAgICAgICAuc29ydCgoYTogYW55LCBiOiBhbnkpID0+IGIuc2l6ZSAtIGEuc2l6ZSlcclxuICAgICAgICAgICAgICAgICAgICAuZm9yRWFjaCgoZmlsZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gQ29yZVNlcnZpY2UuZ2V0UmVsYXRpdmVQYXRoKGZpbGUucGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkTm9kZS5jbGFzc05hbWUgPSAndHJlZS1jaGlsZCc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkTm9kZS50ZXh0Q29udGVudCA9IGAoJHtDb3JlU2VydmljZS5mb3JtYXRCeXRlcyhmaWxlLnNpemUpfSkgJHtwYXRofWA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuQ29udGFpbmVyLmFwcGVuZENoaWxkKGNoaWxkTm9kZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOmYu+atouWGkuazoeWIsCBwYXJlbnROb2RlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOa4hemZpOWFtuS7liBjaGlsZE5vZGUg55qE6auY5LquXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhbGxDaGlsZHJlbiA9IHRyZWVEaXYucXVlcnlTZWxlY3RvckFsbCgnLnRyZWUtY2hpbGQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbENoaWxkcmVuLmZvckVhY2gobm9kZSA9PiBub2RlLmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjdGVkJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5qiZ6KiY6Ieq5bex54K66YG45LitXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZE5vZGUuY2xhc3NMaXN0LmFkZCgnc2VsZWN0ZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWft+ihjOmBuOS4reaTjeS9nFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQ29yZVNlcnZpY2Uuc2VsZWN0RmlsZShwYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8g5Yid5aeL5pS25ZCIXHJcbiAgICAgICAgICAgICAgICBjaGlsZHJlbkNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbkNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gY2hpbGRyZW5Db250YWluZXIuc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnID8gJ2Jsb2NrJyA6ICdub25lJztcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGxhYmVsVG90YWwudGV4dENvbnRlbnQgPSBg57i95qqU5qGI5aSn5bCPOiAke0NvcmVTZXJ2aWNlLmZvcm1hdEJ5dGVzKHRvdGFsU2l6ZSl9YDtcclxuICAgICAgICAgICAgbGFiZWxCYXNlUGF0aC50ZXh0Q29udGVudCA9IGDljIXpq5Tot6/lvpE6ICR7cGFja2FnZU5hbWV9YDtcclxuICAgICAgICB9LFxyXG4gICAgfSxcclxuICAgIHJlYWR5KCkge1xyXG4gICAgICAgIHRoaXMuc2V0UGFja2FnZUxpc3QoKTtcclxuICAgIH0sXHJcbiAgICBiZWZvcmVDbG9zZSgpIHsgfSxcclxuICAgIGNsb3NlKCkgeyB9LFxyXG59KTtcclxuIl19