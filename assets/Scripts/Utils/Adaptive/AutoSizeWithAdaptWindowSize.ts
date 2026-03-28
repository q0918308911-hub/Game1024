import { _decorator, Component, Node, Size, UITransform } from 'cc';
import { AdaptWindowSize } from './AdaptWindowSize';
const { ccclass, property } = _decorator;

/**
 * 此腳本僅根據AdaptWindowSize的尺寸來放大，並不會執行縮小的部分
 */

@ccclass('AutoSizeWithAdaptWindowSize')
export class AutoSizeWithAdaptWindowSize extends Component {

    @property({ type: AdaptWindowSize, tooltip: '每個場景上至少要有一個AdaptWindowSize，才能用來監聽事件' })
    private windowAdapter: AdaptWindowSize = null!;

    @property([Node])
    private resizeNodeList: Node[] = [];

    start() {
        this.windowAdapter?.addResizeListener(this.onResize.bind(this));
    }

    onDestroy() {
        this.windowAdapter?.removeResizeListener(this.onResize.bind(this));
    }

    /**
    * 依據傳入的尺寸計算縮放比例，等比放大指定節點，
    * 以確保節點的寬或高至少覆蓋目標尺寸。
    * 若計算結果小於 1，則維持原本大小，不會進行縮小。
    * @param newSize 
    */
    public onResize(newSize: Size) {
        for (let i = 0; i < this.resizeNodeList.length; i++) {
            const currentUITransform = this.resizeNodeList[i].getComponent(UITransform);

            if (!currentUITransform) {
                console.warn(`node ${this.resizeNodeList[i].name} has no UITransform`);
                continue;
            }

            const widthRatio = newSize.width / currentUITransform.width;
            const heightRatio = newSize.height / currentUITransform.height;
            const scale = Math.max(widthRatio, heightRatio);
            const targetScale = scale < 1 ? 1 : scale;
            this.resizeNodeList[i].setScale(targetScale, targetScale);
        }
    }
}


