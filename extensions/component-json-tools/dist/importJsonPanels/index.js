"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../Utils");
/**
 * @zh 如果希望兼容 3.3 之前的版本可以使用下方的代码
 * @en You can add the code below if you want compatibility with versions prior to 3.3
 */
// Editor.Panel.define = Editor.Panel.define || function(options: any) { return options }
const fs_1 = require("fs");
const path_1 = require("path");
let addComponent = null;
module.exports = Editor.Panel.define({
    listeners: {
        show() { },
        hide() { },
    },
    template: (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../static/template/importJsonPanels/index.html'), 'utf-8'),
    style: (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../static/style/importJsonPanels/index.css'), 'utf-8'),
    $: {
        btn: '#btn',
        nodeField: '#nodeField',
        jsonSelect: '#jsonSelect',
    },
    methods: {
        async addComponent() {
            const nodeUuid = this.$.nodeField.value; // 這就是面板裡選的場景 Node
            if (!nodeUuid) {
                (0, Utils_1.showWarn)('請在面板選一個場景 Node');
                return;
            }
            const jsonUUID = this.$.jsonSelect.value;
            if (!jsonUUID) {
                (0, Utils_1.showWarn)('請選擇json檔案');
                return;
            }
            const result = await Editor.Message.request('component-json-tools', 'import-component-props', nodeUuid, jsonUUID);
            if (result) {
                (0, Utils_1.showLog)(`✅ 加入組件完成`);
            }
            else {
                (0, Utils_1.showLog)(`❌ 加入組件失敗`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvaW1wb3J0SnNvblBhbmVscy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG9DQUFrRTtBQUVsRTs7O0dBR0c7QUFDSCx5RkFBeUY7QUFFekYsMkJBQWtDO0FBQ2xDLCtCQUE0QjtBQUU1QixJQUFJLFlBQVksR0FBUSxJQUFJLENBQUM7QUFFN0IsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUNqQyxTQUFTLEVBQUU7UUFDUCxJQUFJLEtBQUssQ0FBQztRQUNWLElBQUksS0FBSyxDQUFDO0tBQ2I7SUFDRCxRQUFRLEVBQUUsSUFBQSxpQkFBWSxFQUFDLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxtREFBbUQsQ0FBQyxFQUFFLE9BQU8sQ0FBQztJQUNyRyxLQUFLLEVBQUUsSUFBQSxpQkFBWSxFQUFDLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSwrQ0FBK0MsQ0FBQyxFQUFFLE9BQU8sQ0FBQztJQUM5RixDQUFDLEVBQUU7UUFDQyxHQUFHLEVBQUUsTUFBTTtRQUNYLFNBQVMsRUFBRSxZQUFZO1FBQ3ZCLFVBQVUsRUFBRSxhQUFhO0tBQzVCO0lBQ0QsT0FBTyxFQUFFO1FBQ0wsS0FBSyxDQUFDLFlBQVk7WUFDZCxNQUFNLFFBQVEsR0FBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQWlCLENBQUMsS0FBSyxDQUFDLENBQUMsa0JBQWtCO1lBQ3BFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDWixJQUFBLGdCQUFRLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDM0IsT0FBTztZQUNYLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQWtCLENBQUMsS0FBSyxDQUFDO1lBRWxELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDWixJQUFBLGdCQUFRLEVBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ3RCLE9BQU87WUFDWCxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FDdkMsc0JBQXNCLEVBQ3RCLHdCQUF3QixFQUN4QixRQUFRLEVBQ1IsUUFBUSxDQUNYLENBQUM7WUFFRixJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNULElBQUEsZUFBTyxFQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3hCLENBQUM7aUJBQ0ksQ0FBQztnQkFDRixJQUFBLGVBQU8sRUFBQyxVQUFVLENBQUMsQ0FBQztZQUN4QixDQUFDO1FBQ0wsQ0FBQztLQUNKO0lBQ0QsS0FBSyxDQUFDLEtBQUs7UUFDUCxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFDRCxXQUFXO1FBQ1AsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3RELFlBQVksR0FBRyxJQUFJLENBQUM7SUFDeEIsQ0FBQztJQUNELEtBQUssS0FBSyxDQUFDO0NBQ2QsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc2hvd0xvZywgc2hvd1dhcm4sIHNob3dFcnJvciwgd2FpdFRpbWUgfSBmcm9tICcuLi9VdGlscyc7XG5cbi8qKlxuICogQHpoIOWmguaenOW4jOacm+WFvOWuuSAzLjMg5LmL5YmN55qE54mI5pys5Y+v5Lul5L2/55So5LiL5pa555qE5Luj56CBXG4gKiBAZW4gWW91IGNhbiBhZGQgdGhlIGNvZGUgYmVsb3cgaWYgeW91IHdhbnQgY29tcGF0aWJpbGl0eSB3aXRoIHZlcnNpb25zIHByaW9yIHRvIDMuM1xuICovXG4vLyBFZGl0b3IuUGFuZWwuZGVmaW5lID0gRWRpdG9yLlBhbmVsLmRlZmluZSB8fCBmdW5jdGlvbihvcHRpb25zOiBhbnkpIHsgcmV0dXJuIG9wdGlvbnMgfVxuXG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IGpvaW4gfSBmcm9tIFwicGF0aFwiO1xuXG5sZXQgYWRkQ29tcG9uZW50OiBhbnkgPSBudWxsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvci5QYW5lbC5kZWZpbmUoe1xuICAgIGxpc3RlbmVyczoge1xuICAgICAgICBzaG93KCkgeyB9LFxuICAgICAgICBoaWRlKCkgeyB9LFxuICAgIH0sXG4gICAgdGVtcGxhdGU6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy90ZW1wbGF0ZS9pbXBvcnRKc29uUGFuZWxzL2luZGV4Lmh0bWwnKSwgJ3V0Zi04JyksXG4gICAgc3R5bGU6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy9zdHlsZS9pbXBvcnRKc29uUGFuZWxzL2luZGV4LmNzcycpLCAndXRmLTgnKSxcbiAgICAkOiB7XG4gICAgICAgIGJ0bjogJyNidG4nLFxuICAgICAgICBub2RlRmllbGQ6ICcjbm9kZUZpZWxkJyxcbiAgICAgICAganNvblNlbGVjdDogJyNqc29uU2VsZWN0JyxcbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgYXN5bmMgYWRkQ29tcG9uZW50KCkge1xuICAgICAgICAgICAgY29uc3Qgbm9kZVV1aWQgPSAodGhpcy4kLm5vZGVGaWVsZCBhcyBhbnkpLnZhbHVlOyAvLyDpgJnlsLHmmK/pnaLmnb/oo6HpgbjnmoTloLTmma8gTm9kZVxuICAgICAgICAgICAgaWYgKCFub2RlVXVpZCkge1xuICAgICAgICAgICAgICAgIHNob3dXYXJuKCfoq4vlnKjpnaLmnb/pgbjkuIDlgIvloLTmma8gTm9kZScpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QganNvblVVSUQgPSAodGhpcy4kLmpzb25TZWxlY3QgYXMgYW55KS52YWx1ZTtcblxuICAgICAgICAgICAgaWYgKCFqc29uVVVJRCkge1xuICAgICAgICAgICAgICAgIHNob3dXYXJuKCfoq4vpgbjmk4dqc29u5qqU5qGIJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFxuICAgICAgICAgICAgICAgICdjb21wb25lbnQtanNvbi10b29scycsXG4gICAgICAgICAgICAgICAgJ2ltcG9ydC1jb21wb25lbnQtcHJvcHMnLFxuICAgICAgICAgICAgICAgIG5vZGVVdWlkLFxuICAgICAgICAgICAgICAgIGpzb25VVUlELFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHNob3dMb2coYOKchSDliqDlhaXntYTku7blrozmiJBgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNob3dMb2coYOKdjCDliqDlhaXntYTku7blpLHmlZdgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgcmVhZHkoKSB7XG4gICAgICAgIGFkZENvbXBvbmVudCA9IHRoaXMuYWRkQ29tcG9uZW50LmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuJC5idG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhZGRDb21wb25lbnQpO1xuICAgIH0sXG4gICAgYmVmb3JlQ2xvc2UoKSB7XG4gICAgICAgIHRoaXMuJC5idG4ucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhZGRDb21wb25lbnQpO1xuICAgICAgICBhZGRDb21wb25lbnQgPSBudWxsO1xuICAgIH0sXG4gICAgY2xvc2UoKSB7IH0sXG59KTsiXX0=