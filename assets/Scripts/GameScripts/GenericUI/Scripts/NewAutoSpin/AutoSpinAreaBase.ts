import { _decorator, Component, Enum, Node } from "cc";
import { AutoSpinAreaType, AutoSpinAreaVisible, IAutoSpinArea } from "./Interface/IAutoSpinArea";
const { ccclass, property } = _decorator;

@ccclass('CustomAreaBase')
export abstract class AutoSpinAreaBase extends Component implements IAutoSpinArea {
    @property({ type: Enum(AutoSpinAreaType) })
    public autoSpinAreaType: AutoSpinAreaType = AutoSpinAreaType.Other;

    // 初版設計有 "進階設定按鈕" 切換特定區塊的顯示/不顯示
    // @property({ type: Enum(AutoSpinAreaVisible) })
    // public autoSpinAreaVisible: AutoSpinAreaVisible = AutoSpinAreaVisible.Always;

    public init?(param?: any): void;
    public abstract getCustomData(): any;
}

export function getCustomArea(node: Node): AutoSpinAreaBase | null {
    const comp = node.getComponent(AutoSpinAreaBase as any) as AutoSpinAreaBase | null;
    return comp;
}