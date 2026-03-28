import { _decorator, CCString, Component, Node, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('KeySpriteFramePair')
export class KeySpriteFramePair {
    @property({
        displayName: "Key",
        type: CCString,
        serializable: true,
    } as any)
    public key: string;

    @property({
        displayName: "SpriteFrame",
        type: SpriteFrame,
        serializable: true,
    } as any)
    public spriteFrame: SpriteFrame | null = null;
}


