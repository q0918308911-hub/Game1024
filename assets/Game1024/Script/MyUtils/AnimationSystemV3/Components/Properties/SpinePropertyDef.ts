import { _decorator, CCString, Prefab } from 'cc';
import { SpineController } from '../SpineController';

const { ccclass, property } = _decorator;

@ccclass('SpinePropertyDef')
export class SpinePropertyDef {


    @property({
        displayName: "Key",
        type: CCString,
        tooltip: 'spineComponent單一識別碼'
        //serializable: true,
    } as any)

    public key: string;

    @property({
        displayName: "SpineController",
        type: SpineController,
        tooltip: 'spineControllerComponent'
        //serializable: true,
    } as any)

    public spineController: SpineController | null = null;

}