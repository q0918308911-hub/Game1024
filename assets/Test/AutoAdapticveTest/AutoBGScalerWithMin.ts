import { _decorator, Component, Node, Size, UITransform, Vec2 } from 'cc';
import { AdaptWindowSize } from 'db://assets/Scripts/Utils/Adaptive';
const { ccclass, property } = _decorator;

@ccclass('AutoBGScalerWithMin')
export class AutoBGScalerWithMin extends Component {
    @property({ type: AdaptWindowSize, visible: true })
    public windowAdapter: AdaptWindowSize | null = null;

    @property({ type: Node, visible: true })
    public landscapeNode: Node | null = null;

    @property({ type: Node, visible: true })
    public portraitNode: Node | null = null;

    start() {
        this.windowAdapter?.addResizeListener(this.onResize.bind(this));
    }

    onDestroy() {
        this.windowAdapter?.removeResizeListener(this.onResize.bind(this));
    }

    public onResize(newSize: Size) {

        let activeNode = this.landscapeNode;
        if (newSize.width > newSize.height) {
            this.landscapeNode?.setActive(true);
            this.portraitNode?.setActive(false);
        } else {
            if (this.portraitNode) {
                this.portraitNode?.setActive(true);
                this.landscapeNode?.setActive(false);
                activeNode = this.portraitNode;
            }
        }

        const currentUITransform = activeNode.getComponent(UITransform);
        const widthRatio = newSize.width / currentUITransform.width;
        const heightRatio = newSize.height / currentUITransform.height;
        const scale = Math.max(widthRatio, heightRatio);
        const targetScale = scale < 1 ? 1 : scale;
        activeNode.setScale(targetScale, targetScale);
    }
}