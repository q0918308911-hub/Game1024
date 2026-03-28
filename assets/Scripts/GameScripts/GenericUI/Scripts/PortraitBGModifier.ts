import { _decorator, Component, Node, UITransform, Widget } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PortraitBGModifier')
export class PortraitBGModifier extends Widget {
    @property(Widget)
    public leftTarget: Widget = null;

    @property(Widget)
    public rightTarget: Widget = null;

    public override updateAlignment(): void {
        super.updateAlignment();

        const parentUITransform = this.node.parent.getComponent(UITransform);
        const currentUITransform = this.node.getComponent(UITransform);

        if (this.leftTarget) {
            this.leftTarget.right = (parentUITransform.width + currentUITransform.width) / 2;
            this.leftTarget.updateAlignment();
        }

        if (this.rightTarget) {
            this.rightTarget.left = (parentUITransform.width + currentUITransform.width) / 2;
            this.rightTarget.updateAlignment();
        }
    }
}


