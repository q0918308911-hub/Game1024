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
const fs_1 = require("fs");
const path_1 = require("path");
const CoreService = __importStar(require("../../CoreService"));
const Const_1 = require("../../Const");
const package_json_1 = __importDefault(require("../../../package.json"));
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
    template: (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
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
                    value: Const_1.BLANK_TEMPLATE,
                },
                {
                    label: 'HTML面板',
                    value: Const_1.HTML_TEMPLATE,
                },
            ];
            const selectTemplate = this.$.selectTemplate;
            templateList.forEach((item) => {
                const option = document.createElement('option');
                option.value = item.value;
                option.textContent = item.label;
                selectTemplate.appendChild(option);
            });
        },
        onTemplateSelectChange() {
            const selectTemplate = this.$.selectTemplate;
            const templateHint = this.$.templateHint;
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
            const selectTemplate = this.$.selectTemplate;
            const btnCreate = this.$.btnCreate;
            const inputName = this.$.inputName;
            const template = selectTemplate.value;
            const name = inputName.value;
            btnCreate.disabled = true;
            Editor.Message.request(package_json_1.default.name, 'create-extension', template, name).then(() => {
                this.checkCreateBtnCanEnable();
            });
        },
        checkCreateBtnCanEnable() {
            const selectTemplate = this.$.selectTemplate;
            const btnCreate = this.$.btnCreate;
            const inputName = this.$.inputName;
            const inputNameError = this.$.inputNameError;
            const templateValue = selectTemplate.value;
            const checkInputNameResult = CoreService.checkInputName(inputName.value);
            if (checkInputNameResult) {
                inputNameError.style.display = 'block';
                inputNameError.textContent = checkInputNameResult;
                btnCreate.disabled = true;
            }
            else if (!templateValue) {
                inputNameError.style.display = 'block';
                inputNameError.textContent = '請選擇模板';
                btnCreate.disabled = true;
            }
            else {
                inputNameError.style.display = 'none';
                btnCreate.disabled = false;
            }
        },
        // 綁定事件處理函數並保存引用
        boundOnInputNameChange: null,
        boundCreateExtension: null,
        boundOnTemplateSelectChange: null,
    },
    ready() {
        this.setTemplateList();
        this.checkCreateBtnCanEnable();
        // 保存綁定後的函數引用
        this.boundOnInputNameChange = this.onInputNameChange.bind(this);
        this.boundCreateExtension = this.createExtension.bind(this);
        this.boundOnTemplateSelectChange = this.onTemplateSelectChange.bind(this);
        this.$.inputName.addEventListener('input', this.boundOnInputNameChange);
        this.$.btnCreate.addEventListener('click', this.boundCreateExtension);
        this.$.selectTemplate.addEventListener('change', this.boundOnTemplateSelectChange);
    },
    beforeClose() { },
    close() {
        // 使用保存的函數引用來移除事件監聽器
        if (this.boundOnInputNameChange) {
            this.$.inputName.removeEventListener('input', this.boundOnInputNameChange);
        }
        if (this.boundCreateExtension) {
            this.$.btnCreate.removeEventListener('click', this.boundCreateExtension);
        }
        if (this.boundOnTemplateSelectChange) {
            this.$.selectTemplate.removeEventListener('change', this.boundOnTemplateSelectChange);
        }
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL2RlZmF1bHQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJCQUFrQztBQUNsQywrQkFBNEI7QUFFNUIsK0RBQWlEO0FBQ2pELHVDQUE0RDtBQUM1RCx5RUFBZ0Q7QUFDaEQ7OztHQUdHO0FBQ0gseUZBQXlGO0FBQ3pGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFDakMsU0FBUyxFQUFFO0lBQ1AsbUNBQW1DO0lBQ25DLG1DQUFtQztLQUN0QztJQUNELFFBQVEsRUFBRSxJQUFBLGlCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLDZDQUE2QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQy9GLEtBQUssRUFBRSxJQUFBLGlCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLHlDQUF5QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQ3hGLENBQUMsRUFBRTtRQUNDLGNBQWMsRUFBRSxrQkFBa0I7UUFDbEMsWUFBWSxFQUFFLGdCQUFnQjtRQUM5QixTQUFTLEVBQUUsYUFBYTtRQUN4QixjQUFjLEVBQUUsbUJBQW1CO1FBQ25DLFNBQVMsRUFBRSxhQUFhO0tBQzNCO0lBQ0QsT0FBTyxFQUFFO1FBQ0wsZUFBZTtZQUNYLE1BQU0sWUFBWSxHQUFHO2dCQUNqQjtvQkFDSSxLQUFLLEVBQUUsTUFBTTtvQkFDYixLQUFLLEVBQUUsc0JBQWM7aUJBQ3hCO2dCQUNEO29CQUNJLEtBQUssRUFBRSxRQUFRO29CQUNmLEtBQUssRUFBRSxxQkFBYTtpQkFDdkI7YUFDSixDQUFDO1lBQ0YsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxjQUFtQyxDQUFDO1lBQ2xFLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVB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RCxJQUFJLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBK0IsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDcEcsQ0FBQztRQUNELElBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLENBQUMsQ0FBQyxjQUFvQyxDQUFDLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQztRQUNqSCxDQUFDO0lBQ0wsQ0FBQztDQUNKLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcblxuaW1wb3J0ICogYXMgQ29yZVNlcnZpY2UgZnJvbSAnLi4vLi4vQ29yZVNlcnZpY2UnO1xuaW1wb3J0IHsgQkxBTktfVEVNUExBVEUsIEhUTUxfVEVNUExBVEUgfSBmcm9tICcuLi8uLi9Db25zdCc7XG5pbXBvcnQgcGFja2FnZUpTT04gZnJvbSAnLi4vLi4vLi4vcGFja2FnZS5qc29uJztcbi8qKlxuICogQHpoIOWmguaenOW4jOacm+WFvOWuuSAzLjMg5LmL5YmN55qE54mI5pys5Y+v5Lul5L2/55So5LiL5pa555qE5Luj56CBXG4gKiBAZW4gWW91IGNhbiBhZGQgdGhlIGNvZGUgYmVsb3cgaWYgeW91IHdhbnQgY29tcGF0aWJpbGl0eSB3aXRoIHZlcnNpb25zIHByaW9yIHRvIDMuM1xuICovXG4vLyBFZGl0b3IuUGFuZWwuZGVmaW5lID0gRWRpdG9yLlBhbmVsLmRlZmluZSB8fCBmdW5jdGlvbihvcHRpb25zOiBhbnkpIHsgcmV0dXJuIG9wdGlvbnMgfVxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3IuUGFuZWwuZGVmaW5lKHtcbiAgICBsaXN0ZW5lcnM6IHtcbiAgICAgICAgLy8gc2hvdygpIHsgY29uc29sZS5sb2coJ3Nob3cnKTsgfSxcbiAgICAgICAgLy8gaGlkZSgpIHsgY29uc29sZS5sb2coJ2hpZGUnKTsgfSxcbiAgICB9LFxuICAgIHRlbXBsYXRlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvdGVtcGxhdGUvZGVmYXVsdC9pbmRleC5odG1sJyksICd1dGYtOCcpLFxuICAgIHN0eWxlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvc3R5bGUvZGVmYXVsdC9pbmRleC5jc3MnKSwgJ3V0Zi04JyksXG4gICAgJDoge1xuICAgICAgICBzZWxlY3RUZW1wbGF0ZTogJyNzZWxlY3QtdGVtcGxhdGUnLFxuICAgICAgICB0ZW1wbGF0ZUhpbnQ6ICcjdGVtcGxhdGUtaGludCcsXG4gICAgICAgIGlucHV0TmFtZTogJyNpbnB1dC1uYW1lJyxcbiAgICAgICAgaW5wdXROYW1lRXJyb3I6ICcjaW5wdXQtbmFtZS1lcnJvcicsXG4gICAgICAgIGJ0bkNyZWF0ZTogJyNidG4tY3JlYXRlJyxcbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgc2V0VGVtcGxhdGVMaXN0KCkge1xuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVMaXN0ID0gW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICfnqbrnmb3mqKHmnb8nLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogQkxBTktfVEVNUExBVEUsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnSFRNTOmdouadvycsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBIVE1MX1RFTVBMQVRFLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgY29uc3Qgc2VsZWN0VGVtcGxhdGUgPSB0aGlzLiQuc2VsZWN0VGVtcGxhdGUgYXMgSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgICAgICAgICB0ZW1wbGF0ZUxpc3QuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgICAgICAgICAgICAgIG9wdGlvbi52YWx1ZSA9IGl0ZW0udmFsdWU7XG4gICAgICAgICAgICAgICAgb3B0aW9uLnRleHRDb250ZW50ID0gaXRlbS5sYWJlbDtcbiAgICAgICAgICAgICAgICBzZWxlY3RUZW1wbGF0ZS5hcHBlbmRDaGlsZChvcHRpb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uVGVtcGxhdGVTZWxlY3RDaGFuZ2UoKSB7XG4gICAgICAgICAgICBjb25zdCBzZWxlY3RUZW1wbGF0ZSA9IHRoaXMuJC5zZWxlY3RUZW1wbGF0ZSBhcyBIVE1MU2VsZWN0RWxlbWVudDtcbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlSGludCA9IHRoaXMuJC50ZW1wbGF0ZUhpbnQgYXMgSFRNTFNwYW5FbGVtZW50O1xuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBzZWxlY3RUZW1wbGF0ZS52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IGhpbnQgPSBDb3JlU2VydmljZS5nZXRUZW1wbGF0ZUhpbnQodGVtcGxhdGUpO1xuICAgICAgICAgICAgdGVtcGxhdGVIaW50LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgdGVtcGxhdGVIaW50LnRleHRDb250ZW50ID0gaGludDtcblxuICAgICAgICAgICAgdGhpcy5jaGVja0NyZWF0ZUJ0bkNhbkVuYWJsZSgpO1xuICAgICAgICB9LFxuICAgICAgICBvbklucHV0TmFtZUNoYW5nZSgpIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tDcmVhdGVCdG5DYW5FbmFibGUoKTtcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlRXh0ZW5zaW9uKCkge1xuICAgICAgICAgICAgY29uc3Qgc2VsZWN0VGVtcGxhdGUgPSB0aGlzLiQuc2VsZWN0VGVtcGxhdGUgYXMgSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCBidG5DcmVhdGUgPSB0aGlzLiQuYnRuQ3JlYXRlIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgICAgICAgICAgY29uc3QgaW5wdXROYW1lID0gdGhpcy4kLmlucHV0TmFtZSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IHNlbGVjdFRlbXBsYXRlLnZhbHVlO1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGlucHV0TmFtZS52YWx1ZTtcbiAgICAgICAgICAgIGJ0bkNyZWF0ZS5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KHBhY2thZ2VKU09OLm5hbWUsICdjcmVhdGUtZXh0ZW5zaW9uJywgdGVtcGxhdGUsIG5hbWUpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tDcmVhdGVCdG5DYW5FbmFibGUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBjaGVja0NyZWF0ZUJ0bkNhbkVuYWJsZSgpIHtcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdFRlbXBsYXRlID0gdGhpcy4kLnNlbGVjdFRlbXBsYXRlIGFzIEhUTUxTZWxlY3RFbGVtZW50O1xuICAgICAgICAgICAgY29uc3QgYnRuQ3JlYXRlID0gdGhpcy4kLmJ0bkNyZWF0ZSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbiAgICAgICAgICAgIGNvbnN0IGlucHV0TmFtZSA9IHRoaXMuJC5pbnB1dE5hbWUgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICAgICAgICAgIGNvbnN0IGlucHV0TmFtZUVycm9yID0gdGhpcy4kLmlucHV0TmFtZUVycm9yIGFzIEhUTUxTcGFuRWxlbWVudDtcbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlVmFsdWUgPSBzZWxlY3RUZW1wbGF0ZS52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IGNoZWNrSW5wdXROYW1lUmVzdWx0ID0gQ29yZVNlcnZpY2UuY2hlY2tJbnB1dE5hbWUoaW5wdXROYW1lLnZhbHVlKTtcblxuICAgICAgICAgICAgaWYgKGNoZWNrSW5wdXROYW1lUmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaW5wdXROYW1lRXJyb3Iuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICAgICAgaW5wdXROYW1lRXJyb3IudGV4dENvbnRlbnQgPSBjaGVja0lucHV0TmFtZVJlc3VsdDtcbiAgICAgICAgICAgICAgICBidG5DcmVhdGUuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghdGVtcGxhdGVWYWx1ZSkge1xuICAgICAgICAgICAgICAgIGlucHV0TmFtZUVycm9yLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgICAgIGlucHV0TmFtZUVycm9yLnRleHRDb250ZW50ID0gJ+iri+mBuOaTh+aooeadvyc7XG4gICAgICAgICAgICAgICAgYnRuQ3JlYXRlLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5wdXROYW1lRXJyb3Iuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICBidG5DcmVhdGUuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvLyDntoHlrprkuovku7bomZXnkIblh73mlbjkuKbkv53lrZjlvJXnlKhcbiAgICAgICAgYm91bmRPbklucHV0TmFtZUNoYW5nZTogbnVsbCBhcyBhbnksXG4gICAgICAgIGJvdW5kQ3JlYXRlRXh0ZW5zaW9uOiBudWxsIGFzIGFueSxcbiAgICAgICAgYm91bmRPblRlbXBsYXRlU2VsZWN0Q2hhbmdlOiBudWxsIGFzIGFueSxcbiAgICB9LFxuICAgIHJlYWR5KCkge1xuICAgICAgICB0aGlzLnNldFRlbXBsYXRlTGlzdCgpO1xuICAgICAgICB0aGlzLmNoZWNrQ3JlYXRlQnRuQ2FuRW5hYmxlKCk7XG5cbiAgICAgICAgLy8g5L+d5a2Y57aB5a6a5b6M55qE5Ye95pW45byV55SoXG4gICAgICAgIHRoaXMuYm91bmRPbklucHV0TmFtZUNoYW5nZSA9IHRoaXMub25JbnB1dE5hbWVDaGFuZ2UuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5ib3VuZENyZWF0ZUV4dGVuc2lvbiA9IHRoaXMuY3JlYXRlRXh0ZW5zaW9uLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuYm91bmRPblRlbXBsYXRlU2VsZWN0Q2hhbmdlID0gdGhpcy5vblRlbXBsYXRlU2VsZWN0Q2hhbmdlLmJpbmQodGhpcyk7XG5cbiAgICAgICAgKHRoaXMuJC5pbnB1dE5hbWUgYXMgSFRNTElucHV0RWxlbWVudCkuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCB0aGlzLmJvdW5kT25JbnB1dE5hbWVDaGFuZ2UpO1xuICAgICAgICAodGhpcy4kLmJ0bkNyZWF0ZSBhcyBIVE1MQnV0dG9uRWxlbWVudCkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmJvdW5kQ3JlYXRlRXh0ZW5zaW9uKTtcbiAgICAgICAgKHRoaXMuJC5zZWxlY3RUZW1wbGF0ZSBhcyBIVE1MU2VsZWN0RWxlbWVudCkuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy5ib3VuZE9uVGVtcGxhdGVTZWxlY3RDaGFuZ2UpO1xuICAgIH0sXG4gICAgYmVmb3JlQ2xvc2UoKSB7IH0sXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIC8vIOS9v+eUqOS/neWtmOeahOWHveaVuOW8leeUqOS+huenu+mZpOS6i+S7tuebo+iBveWZqFxuICAgICAgICBpZiAodGhpcy5ib3VuZE9uSW5wdXROYW1lQ2hhbmdlKSB7XG4gICAgICAgICAgICAodGhpcy4kLmlucHV0TmFtZSBhcyBIVE1MSW5wdXRFbGVtZW50KS5yZW1vdmVFdmVudExpc3RlbmVyKCdpbnB1dCcsIHRoaXMuYm91bmRPbklucHV0TmFtZUNoYW5nZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuYm91bmRDcmVhdGVFeHRlbnNpb24pIHtcbiAgICAgICAgICAgICh0aGlzLiQuYnRuQ3JlYXRlIGFzIEhUTUxCdXR0b25FbGVtZW50KS5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuYm91bmRDcmVhdGVFeHRlbnNpb24pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmJvdW5kT25UZW1wbGF0ZVNlbGVjdENoYW5nZSkge1xuICAgICAgICAgICAgKHRoaXMuJC5zZWxlY3RUZW1wbGF0ZSBhcyBIVE1MU2VsZWN0RWxlbWVudCkucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy5ib3VuZE9uVGVtcGxhdGVTZWxlY3RDaGFuZ2UpO1xuICAgICAgICB9XG4gICAgfSxcbn0pO1xuIl19