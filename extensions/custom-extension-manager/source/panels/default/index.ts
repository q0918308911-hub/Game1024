import { readFileSync } from 'fs';
import { join } from 'path';

import * as CoreService from '../../CoreService';
import { BLANK_TEMPLATE, HTML_TEMPLATE } from '../../Const';
import packageJSON from '../../../package.json';
/**
 * @zh 如果希望兼容 3.3 之前的版本可以使用下方的代码
 * @en You can add the code below if you want compatibility with versions prior to 3.3
 */
// Editor.Panel.define = Editor.Panel.define || function(options: any) { return options }
module.exports = Editor.Panel.define({
    listeners: {
        // show() { console.log('show'); },
        // hide() { console.log('hide'); },
    },
    template: readFileSync(join(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        selectTemplate: '#select-template',
        templateHint: '#template-hint',
        inputName: '#input-name',
        inputNameError: '#input-name-error',
        btnCreate: '#btn-create',
    },
    methods: {
        setTemplateList() {
            const templateList = [
                {
                    label: '空白模板',
                    value: BLANK_TEMPLATE,
                },
                {
                    label: 'HTML面板',
                    value: HTML_TEMPLATE,
                },
            ];
            const selectTemplate = this.$.selectTemplate as HTMLSelectElement;
            templateList.forEach((item) => {
                const option = document.createElement('option');
                option.value = item.value;
                option.textContent = item.label;
                selectTemplate.appendChild(option);
            });
        },
        onTemplateSelectChange() {
            const selectTemplate = this.$.selectTemplate as HTMLSelectElement;
            const templateHint = this.$.templateHint as HTMLSpanElement;
            const template = selectTemplate.value;
            const hint = CoreService.getTemplateHint(template);
            templateHint.style.display = 'block';
            templateHint.textContent = hint;

            this.checkCreateBtnCanEnable();
        },
        onInputNameChange() {
            this.checkCreateBtnCanEnable();
        },
        createExtension() {
            const selectTemplate = this.$.selectTemplate as HTMLSelectElement;
            const btnCreate = this.$.btnCreate as HTMLButtonElement;
            const inputName = this.$.inputName as HTMLInputElement;

            const template = selectTemplate.value;
            const name = inputName.value;
            btnCreate.disabled = true;
            Editor.Message.request(packageJSON.name, 'create-extension', template, name).then(() => {
                this.checkCreateBtnCanEnable();
            });
        },
        checkCreateBtnCanEnable() {
            const selectTemplate = this.$.selectTemplate as HTMLSelectElement;
            const btnCreate = this.$.btnCreate as HTMLButtonElement;
            const inputName = this.$.inputName as HTMLInputElement;
            const inputNameError = this.$.inputNameError as HTMLSpanElement;
            const templateValue = selectTemplate.value;
            const checkInputNameResult = CoreService.checkInputName(inputName.value);

            if (checkInputNameResult) {
                inputNameError.style.display = 'block';
                inputNameError.textContent = checkInputNameResult;
                btnCreate.disabled = true;
            } else if (!templateValue) {
                inputNameError.style.display = 'block';
                inputNameError.textContent = '請選擇模板';
                btnCreate.disabled = true;
            } else {
                inputNameError.style.display = 'none';
                btnCreate.disabled = false;
            }
        },

        // 綁定事件處理函數並保存引用
        boundOnInputNameChange: null as any,
        boundCreateExtension: null as any,
        boundOnTemplateSelectChange: null as any,
    },
    ready() {
        this.setTemplateList();
        this.checkCreateBtnCanEnable();

        // 保存綁定後的函數引用
        this.boundOnInputNameChange = this.onInputNameChange.bind(this);
        this.boundCreateExtension = this.createExtension.bind(this);
        this.boundOnTemplateSelectChange = this.onTemplateSelectChange.bind(this);

        (this.$.inputName as HTMLInputElement).addEventListener('input', this.boundOnInputNameChange);
        (this.$.btnCreate as HTMLButtonElement).addEventListener('click', this.boundCreateExtension);
        (this.$.selectTemplate as HTMLSelectElement).addEventListener('change', this.boundOnTemplateSelectChange);
    },
    beforeClose() { },
    close() {
        // 使用保存的函數引用來移除事件監聽器
        if (this.boundOnInputNameChange) {
            (this.$.inputName as HTMLInputElement).removeEventListener('input', this.boundOnInputNameChange);
        }
        if (this.boundCreateExtension) {
            (this.$.btnCreate as HTMLButtonElement).removeEventListener('click', this.boundCreateExtension);
        }
        if (this.boundOnTemplateSelectChange) {
            (this.$.selectTemplate as HTMLSelectElement).removeEventListener('change', this.boundOnTemplateSelectChange);
        }
    },
});
