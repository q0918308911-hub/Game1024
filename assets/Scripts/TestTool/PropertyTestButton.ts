import { _decorator, CCString, error } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PropertyTestButton')
export class PropertyTestButton {
    private _runFunction: boolean = false;

    @property({ displayName: '執行方法' })
    get runFunction(): boolean {
        return this._runFunction;
    }

    set runFunction(value: boolean) {
        if (this.targetComponent) {
            if (this.targetFunction) {
                if (this._useInspectorArgs) {
                    const jsonString = `[${this.inspectorArgs.join(',')}]`.replace(/'/g, '"');
                    const args = JSON.parse(jsonString);
                    this.targetFunction.apply(this.targetComponent, args);
                } else {
                    this.targetFunction.apply(this.targetComponent, this.propertyArgs);
                }
            } else if (value) {
                error('待執行方法不存在');
            }
        } else if (value) {
            error('執行 target 不存在');
        }
    }

    private targetComponent: any = null;
    private targetFunction: Function = null;
    private propertyArgs: any[] = [];

    @property({ readonly: true, displayName: '方法名稱' })
    public functionName: string;

    private _useInspectorArgs: boolean = false;

    @property({ displayName: '使用自訂參數' })
    get useInspectorArgs() {
        return this._useInspectorArgs;
    }

    set useInspectorArgs(value: boolean) {
        this._useInspectorArgs = value;
        this.inspectorArgs = new Array(this.targetFunction.length).fill('');
    }

    @property({ type: [CCString], displayName: '自訂參數', visible() { return (this as PropertyTestButton)._useInspectorArgs } })
    public inspectorArgs: string[] = [];

    constructor(functionName: string, propertyArgs: any[], targetFunction: Function, targetComponent: any) {
        this.functionName = functionName;
        this.propertyArgs = propertyArgs
        this.targetFunction = targetFunction;
        this.targetComponent = targetComponent;
    }
}


