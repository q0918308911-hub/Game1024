import { _decorator, CCString, error, warn } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CustomTestButton')
export class CustomTestButton {
    private _runFunction: boolean = false;

    @property({ displayName: '執行方法' })
    get runFunction(): boolean {
        return this._runFunction;
    }

    set runFunction(value: boolean) {
        if (this._targetComponent) {
            const targetFunction = this._targetComponent[this.functionName];
            if (targetFunction) {
                const jsonString = `[${this.functionArgs.join(',')}]`.replace(/'/g, '"');
                const args = JSON.parse(jsonString);
                targetFunction.apply(this._targetComponent, args);
            } else {
                warn(`方法名稱不存在: ${this.functionName}`);
            }
        } else if (value) {
            error('錯誤，target 不存在');
        }
    }

    private _targetComponent: any = null;
    public set targetComponent(target: any) {
        this._targetComponent = target;
    }

    private _functionName: string = '';

    @property({ displayName: '方法名稱' })
    public get functionName(): string {
        return this._functionName;
    }

    public set functionName(name: string) {
        this._functionName = name;
        if (name && this._targetComponent[name]) {
            this.functionArgs = new Array(this._targetComponent[name].length).fill('');
        } else {
            this.functionArgs.length = 0;
        }
    }

    @property({ type: [CCString], displayName: '參數' })
    public functionArgs: string[] = [];
}


