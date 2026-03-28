import { _decorator, Component, Node, Size, UITransform, Vec2 } from 'cc';
import { AdaptWindowSize } from 'db://assets/Scripts/Utils/Adaptive';
const { ccclass, property } = _decorator;

@ccclass('WidgetRefHelper')
export class WidgetRefHelper extends Component {
    @property(AdaptWindowSize)
    private WindowAdapter: AdaptWindowSize | null = null;

    @property(Vec2)
    private minSize: Vec2 = new Vec2(0, 0);

    @property(Vec2)
    private maxSize: Vec2 = new Vec2(0, 0);

    start() {
        this.WindowAdapter?.addResizeListener(this.onResize.bind(this));
    }

    onDestroy() {
        this.WindowAdapter?.removeResizeListener(this.onResize.bind(this));
    }

    onResize(newSize: Size) {

        let targetSize: Vec2 = new Vec2(0, 0);

        if (newSize.width < this.minSize.x) {
            targetSize.x = this.minSize.x;
        } else if (newSize.width > this.maxSize.x) {
            targetSize.x = this.maxSize.x;
        } else {
            targetSize.x = newSize.width;
        }

        if (newSize.height < this.minSize.y) {
            targetSize.y = this.minSize.y;
        } else if (newSize.height > this.maxSize.y) {
            targetSize.y = this.maxSize.y;
        } else {
            targetSize.y = newSize.height;
        }

        this.node.getComponent(UITransform).setContentSize(targetSize.x, targetSize.y);
    }

}


