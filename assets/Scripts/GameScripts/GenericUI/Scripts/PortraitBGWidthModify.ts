import { _decorator, Component, Size, UITransform } from 'cc';
import { AdaptWindowSize } from '../../../Utils/Adaptive';
const { ccclass, property } = _decorator;

@ccclass('PortraitBGWidthModify')
export class PortraitBGWidthModify extends Component {
    @property({ type: AdaptWindowSize, visible: true })
    public WindowAdapter: AdaptWindowSize | null = null;

    @property({ type: UITransform, visible: true })
    public LeftNode: UITransform | null = null;

    @property({ type: UITransform, visible: true })
    public RightNode: UITransform | null = null;

    protected _centerNodeWidth: number = 720;

    start() {
        this.WindowAdapter?.addResizeListener(this.onResize.bind(this));
    }

    protected onDestroy(): void {
        this.WindowAdapter?.removeResizeListener(this.onResize.bind(this));
    }

    protected onResize(newSize: Size) {
        const newWidth = (newSize.width - this._centerNodeWidth) / 2;
        this.LeftNode.width = newWidth;
        this.RightNode.width = newWidth;
    }
}


