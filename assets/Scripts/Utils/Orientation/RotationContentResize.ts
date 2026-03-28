import { _decorator, Component, math, Node, Rect, UITransform, Vec2, Widget } from 'cc';
import { Orientation } from '../../GameScripts/Definition';
const { ccclass, property } = _decorator;

@ccclass('RotationContentResize')
export class RotationContentResize extends Component {

    @property(math.Size)
    public landscapeContent: math.Size = new math.Size(0, 0);

    @property(math.Size)
    public portraitContent: math.Size = new math.Size(0, 0);


    public onRotationResize(orientation: Orientation) {
        if (orientation == Orientation.Landscape) {
            this.getComponent(UITransform).setContentSize(this.landscapeContent.width, this.landscapeContent.height);
        }
        else {
            this.getComponent(UITransform).setContentSize(this.portraitContent.width, this.portraitContent.height);
        }

        const widgets = this.node.getComponentsInChildren(Widget);
        for (let i = 0; i < widgets.length; i++) {
            widgets[i].updateAlignment();
        }
    }
}


