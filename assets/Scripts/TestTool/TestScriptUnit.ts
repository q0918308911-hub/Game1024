import { _decorator } from 'cc';
import { autoTestRegistry } from './TestableFunction';
import { PropertyTestButton } from './PropertyTestButton';
import { CustomTestButton } from './CustomTestButton';
const { ccclass, property } = _decorator;

@ccclass('TestScriptUnit')
export class TestScriptUnit {
    @property({ displayName: '組件名稱', readonly: true })
    public componentNameInput: string = '';

    @property({
        type: [PropertyTestButton],
        displayName: '裝飾器方法列表',
        readonly: true,
    })
    public propertyTestButtons: PropertyTestButton[] = [];

    @property({
        type: [CustomTestButton],
        displayName: '自訂方法列表',
    })
    private _customTestButtons: CustomTestButton[] = [];

    @property({
        type: [CustomTestButton],
        displayName: '自訂方法列表',
    })
    public get customTestButtons(): CustomTestButton[] {
        return this._customTestButtons;
    };

    public set customTestButtons(testButtons: CustomTestButton[]) {
        if (this._customTestButtons.length !== testButtons.length) {
            this._customTestButtons = testButtons;
            this.setCustomTestButtonsTarget();
        }
    }

    private _targetComponent: any = null;

    public set targetComponent(component: any) {
        this._targetComponent = component;
        this.componentNameInput = component.constructor.name;
        this.updatePropertyTestButtons();
    }

    /**
      * 更新 @TestableFunction 裝飾器標記的測試按鈕列表
      */
    private updatePropertyTestButtons(): void {
        this.propertyTestButtons.length = 0;

        const component = this._targetComponent;
        const registry = autoTestRegistry.get(component.constructor);
        if (!registry) return;
        for (const entry of registry) {
            const testFunction = component[entry.name];
            const newTestButton = new PropertyTestButton(entry.name, entry.args, testFunction, component);
            this.propertyTestButtons.push(newTestButton);
        }
    }

    /**
     * 設置自訂測試按鈕的執行 target
     */
    private setCustomTestButtonsTarget(): void {
        this.customTestButtons.forEach((testButton) => {
            testButton.targetComponent = this._targetComponent;
        })
    }

}


