import { _decorator, CCString, Vec2 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ContentSizeDef')

export class ContentSizeDef {


    @property({
        displayName: "Key",
        type: CCString,
        tooltip: '變形icon索引'
    } as any)

    public key: string;

    @property({
        displayName: "size",
        type: Vec2,
        tooltip: '搭配變形索引size'
    } as any)

    public size: Vec2 | null = null;
}