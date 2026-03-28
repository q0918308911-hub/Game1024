/**
 * @zh 如果希望兼容 3.3 之前的版本可以使用下方的代码
 * @en You can add the code below if you want compatibility with versions prior to 3.3
 */
// Editor.Panel.define = Editor.Panel.define || function(options: any) { return options }

import { readFileSync } from "fs";
import { join } from "path";
import { showLog, showWarn, showError, waitTime } from '../Utils';

module.exports = Editor.Panel.define({
    listeners: {
        show() { },
        hide() { },
    },
    template: readFileSync(join(__dirname, '../../static/template/exportJsonPanels/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../static/style/exportJsonPanels/index.css'), 'utf-8'),
    $: {
        btn: '#btn',
        componentSelect: '#componentSelect',
        filename: '#filename',
        nodeField: '#nodeField',
    },
    methods: {
        async updateComponent() {
            const nodeUuid = (this.$.nodeField as any).value;
            const compNameInput = this.$.componentSelect as HTMLSelectElement;

            if (!nodeUuid) {
                compNameInput.length = 0;
                return;
            };

            // 查 Node 上所有 Components
            const nodeInfo = await Editor.Message.request('scene', 'query-node', nodeUuid);

            if (!nodeInfo) {
                compNameInput.length = 0;
                return;
            }
            compNameInput.innerHTML = '';

            for (const comp of nodeInfo.__comps__) {
                const option = document.createElement('option');
                option.value = comp.type;
                option.text = comp.type;
                compNameInput.add(option);
            }
        },

        async componentExportJson() {
            const nodeUuid = (this.$.nodeField as any).value; // 這就是面板裡選的場景 Node
            const compNameInput = this.$.componentSelect as HTMLSelectElement;

            if (!nodeUuid) {
                showWarn('請在面板選一個場景 Node');
                return;
            }

            const compName = (compNameInput as any).value.trim();

            if (!compName) {
                showWarn('請輸入 Component 名稱');
                return;
            }

            const filename = (this.$.filename as any).value.trim() || 'export';

            const savePath = await Editor.Message.request(
                'component-json-tools',
                'export-component-props',
                nodeUuid,
                compName,
                filename
            );

            if (savePath) {
                showLog(`✅ 匯出Json完成：${savePath}`);
            }
            else {
                showLog(`❌ 匯出Json失敗`);
            }
        },
        boundUpdateComponent: null as any,
        boundComponentExportJson: null as any,
    },
    async ready() {
        // 當 Node 被選取
        this.boundUpdateComponent = this.updateComponent.bind(this);
        this.boundComponentExportJson = this.componentExportJson.bind(this);

        this.$.nodeField.addEventListener('confirm', this.boundUpdateComponent);
        this.$.btn.addEventListener('click', this.boundComponentExportJson);
    },
    beforeClose() {

    },
    close() {
        this.$.nodeField.removeEventListener('confirm', this.boundUpdateComponent);
        this.$.btn.removeEventListener('click', this.boundComponentExportJson);
    },
});