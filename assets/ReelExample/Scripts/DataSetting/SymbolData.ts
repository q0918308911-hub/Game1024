import { _decorator, Component, Node, Prefab, SpriteFrame } from 'cc';
import { SymbolEvent } from './SymbolEvent';
const { ccclass, property } = _decorator;

@ccclass('SymbolData')
export class SymbolData {
    @property({ type: SpriteFrame, displayName: '模糊圖' })
    public blurSpriteFrame: SpriteFrame = null;

    @property({ type: Prefab, displayName: 'prefab' })
    public prefab: Prefab = null;

    @property({ displayName: '是否是scatter' })
    public isScatter: boolean = false;

    @property({ type: SymbolEvent, displayName: '事件列表' })
    public eventList: SymbolEvent[] = [];
}