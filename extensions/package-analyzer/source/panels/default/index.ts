import { readFileSync } from 'fs';
import { join } from 'path';
import * as CoreService from '../../CoreService';
import { FileGroup } from '../../FileGroup';
/**
 * @zh 如果希望兼容 3.3 之前的版本可以使用下方的代码
 * @en You can add the code below if you want compatibility with versions prior to 3.3
 */
// Editor.Panel.define = Editor.Panel.define || function(options: any) { return options }
module.exports = Editor.Panel.define({
    listeners: {},
    template: readFileSync(join(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
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
                const comboBuild = this.$.comboBuild as HTMLSelectElement;
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
        showFilesInPackage(packageName: string) {
            const treeDiv = this.$.tree as HTMLElement;
            const labelTotal = this.$.labelTotal as HTMLTextAreaElement;
            const labelBasePath = this.$.labelBasePath as HTMLTextAreaElement;

            // 1. 清空 UI
            treeDiv.innerHTML = '';
            labelTotal.textContent = '總檔案大小: ';
            labelBasePath.textContent = '包體路徑: ';

            // 2. 讀包體的 config.json
            CoreService.setConfigJson(packageName);

            // 3. 取得包體的所有檔案
            const fileDict: Map<string, FileGroup> = CoreService.getAllFileInPackage(packageName);

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
                    .sort((a: any, b: any) => b.size - a.size)
                    .forEach((file: any) => {
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
