import { _decorator, CCString, Component, sp, SpriteFrame, Texture2D, } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SlotAttaches')
export class SlotAttaches {
    @property(CCString)
    public slotName: string = "";

    @property(SpriteFrame)
    public spriteFrame: SpriteFrame = null!;
}