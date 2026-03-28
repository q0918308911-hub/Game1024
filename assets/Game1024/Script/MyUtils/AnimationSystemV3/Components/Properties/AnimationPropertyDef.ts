import { _decorator, CCString, Prefab } from 'cc';
import { AnimationController } from '../AnimationController';

const { ccclass, property } = _decorator;

@ccclass('AnimationPropertyDef')
export class AnimationPropertyDef {


    @property({
        displayName: "Key",
        type: CCString,
        tooltip: 'AnimationComponent單一識別碼'
        //serializable: true,
    } as any)

    public key: string;

    @property({
        displayName: "AnimationController",
        type: AnimationController,
        tooltip: 'AnimationControllerComponent'
        //serializable: true,
    } as any)

    public animationController: AnimationController | null = null;

}