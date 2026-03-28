import { showLog, showWarn, showError, waitTime } from '../Utils';

/**
 * @zh 如果希望兼容 3.3 之前的版本可以使用下方的代码
 * @en You can add the code below if you want compatibility with versions prior to 3.3
 */
// Editor.Panel.define = Editor.Panel.define || function(options: any) { return options }

import { readFileSync } from "fs";
import { join } from "path";

let addComponent: any = null;

module.exports = Editor.Panel.define({
    listeners: {
        show() { },
        hide() { },
    },
    template: readFileSync(join(__dirname, '../../static/template/importJsonPanels/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../static/style/importJsonPanels/index.css'), 'utf-8'),
    $: {
        btn: '#btn',
        nodeField: '#nodeField',
        jsonSelect: '#jsonSelect',
    },
    methods: {
        async addComponent() {
            const nodeUuid = (this.$.nodeField as any).value; // 這就是面板裡選的場景 Node
            if (!nodeUuid) {
                showWarn('請在面板選一個場景 Node');
                return;
            }

            const jsonUUID = (this.$.jsonSelect as any).value;

            if (!jsonUUID) {
                showWarn('請選擇json檔案');
                return;
            }

            const result = await Editor.Message.request(
                'component-json-tools',
                'import-component-props',
                nodeUuid,
                jsonUUID,
            );

            if (result) {
                showLog(`✅ 加入組件完成`);
            }
            else {
                showLog(`❌ 加入組件失敗`);
            }
        }
    },
    async ready() {
        addComponent = this.addComponent.bind(this);
        this.$.btn.addEventListener('click', addComponent);
    },
    beforeClose() {
        this.$.btn.removeEventListener('click', addComponent);
        addComponent = null;
    },
    close() { },
});