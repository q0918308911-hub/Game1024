import { _decorator, Component, Node, UITransform, Vec3 } from 'cc';
const { ccclass } = _decorator;

@ccclass('IconBase')
export abstract class IconBase extends Component {
    protected _originSiblingIndex: number = 0;

    public set originSiblingIndex(index: number) {
        this._originSiblingIndex = index;
    }

    public get originSiblingIndex(): number {
        return this._originSiblingIndex;
    }

    public abstract updateSymbol(symbolID: number): void;

    public init(): void {
        this.originSiblingIndex = this.node.getSiblingIndex();
    }

    public setParent(rootNode: Node): void {
        this.node.setParent(rootNode);
    }

    public setPosition(pos: Vec3): void {
        this.node.setPosition(pos);
    }

    public show(): void {
        this.node.active = true;
    }

    public hide(): void {
        this.node.active = false;
    }

    public setAnchor(anchorX: number, anchorY: number): void {
        this.getComponent(UITransform).setAnchorPoint(anchorX, anchorY);
    }
}