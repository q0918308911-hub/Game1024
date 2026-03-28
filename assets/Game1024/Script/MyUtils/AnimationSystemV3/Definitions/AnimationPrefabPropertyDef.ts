import { _decorator, CCString, Prefab } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('AnimationPrefabPropertyDef')

export class AnimationPrefabPropertyDef {


    @property({
        displayName: "Key",
        type: CCString,
        tooltip: 'prefab單一識別碼'
        //serializable: true,
    } as any)

    public key: string;

    @property({
        displayName: "Prefab",
        type: Prefab,
        tooltip: 'prefab'
        //serializable: true,
    } as any)

    public prefab: Prefab | null = null;

}