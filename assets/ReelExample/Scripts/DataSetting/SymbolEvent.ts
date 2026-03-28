import { _decorator, Component, Enum, Node } from 'cc';
const { ccclass, property } = _decorator;

export enum SymbolEventType {
    OnBounceMax, //回彈到最底部
    ReadyHand, //聽牌
    RollEnd, //滾輪結束
    Connect, //中獎
    Default, //預設狀態，動畫中斷時會觸發
}

@ccclass('SymbolEvent')
export class SymbolEvent {
    @property({ type: Enum(SymbolEventType), displayName: '事件類型' })
    public eventType: SymbolEventType = SymbolEventType.Connect;

    @property({ displayName: '動畫名稱' })
    public animName: string = '';
}


