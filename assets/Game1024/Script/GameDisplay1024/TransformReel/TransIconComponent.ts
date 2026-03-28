import { _decorator, Component, Node, Size, Sprite, SpriteFrame, UITransform, v3, Vec2 } from 'cc';
//--這個比較特殊一點要解構的方式抽出config裡面的變數就要單獨出來免得造成循環引用
import { DefinitionGameConfigData } from '../../DefinitionGameData1024/GameConfigInstance1024';
const {
    WILD_LIST
} = DefinitionGameConfigData;
const { ccclass, property } = _decorator;


@ccclass('TransIconComponent')
export class TransIconComponent extends Component {

    @property({ type: Node, visible: true, displayName: 'TransMaskNode', tooltip: '變形遮罩' })
    private _transMaskNode: Node = null;

    @property({ type: Node, visible: true, displayName: 'TransFrameNode', tooltip: '變形邊框' })
    private _transFrameNode: Node = null;

    @property({ type: Node, visible: true, displayName: 'IconNode', tooltip: 'iconSymbol' })
    private _iconNode: Node = null;

    //--特殊款(wild)使用的spriteFrame列表
    @property({ type: [SpriteFrame], visible: true, displayName: 'TransIconSpriteFrameList', tooltip: '變形icon對應的spriteFrame' })
    private _transIconSpriteFrameList: SpriteFrame[] = [];

    private _wildSpriteFrameMap: Map<number, SpriteFrame> = new Map<number, SpriteFrame>();

    private _frameTransformComponent: UITransform = null;
    private _maskTransformComponent: UITransform = null;

    private _transformTargetInfo: { frame: Vec2, mask: Vec2, iconPos: Vec2 } = null;
    //--該次補牌後該軸預計的最大長度
    private _reelMaxLen: number = 2;
    //--抽取變形軸對應的index(要去map裡面取出對應的size vec2)
    private _tarnsReelMapIndex: number = 0;

    private _symbolId: number = 0;

    public set symbolId(id: number) {
        this._symbolId = id;
        //--設定對應的spriteFrame
    }


    set reelMaxLen(len: number) {
        this._reelMaxLen = len;
    }

    public onLoad(): void {
        //--init mapData
        this.init();
    }

    private init(): void {

        if (this._transMaskNode && this._transFrameNode) {
            this._frameTransformComponent = this._transFrameNode.getComponent(UITransform);
            this._maskTransformComponent = this._transMaskNode.getComponent(UITransform);
        }

        if (this._transIconSpriteFrameList.length > 0) {

            for (let i = 0; i < this._transIconSpriteFrameList.length; i++) {
                this._wildSpriteFrameMap.set(i + 3, this._transIconSpriteFrameList[i]);
            }
        }

    }



    //--擠壓變形需要的size資料
    public setTransformReelTarget(reelMaxLen: number, transformTargetInfo: { frame: Vec2, mask: Vec2, iconPos: Vec2 }): void {

        this._tarnsReelMapIndex = reelMaxLen;
        this._transformTargetInfo = transformTargetInfo;
    }


    /**
     * <這邊是塞變形後的>
     * @param lens 包含wild的symbol總長度
     */
    public setWildSprIconBeforeUpdate(lens: number): void {

        const sprFrame = this._wildSpriteFrameMap.get(lens);
        if (sprFrame) {
            const sprComp = this._iconNode.getComponent(Sprite);
            sprComp.spriteFrame = sprFrame;
        }
    }

    public layoutWildBeforeUpdate(beforeSize: Vec2): void {

        const uiTrans = this._iconNode.getComponent(UITransform);
        uiTrans.setContentSize(new Size(beforeSize.x, beforeSize.y));

    }

    //--初始化前的layout設定
    public layoutBeforeUpdate(beforeTransSize: { frame: Vec2, mask: Vec2, iconPos: Vec2 }): void {

        if (this._symbolId != WILD_LIST[0]) {

            this._frameTransformComponent.setContentSize(new Size(beforeTransSize.frame.x, beforeTransSize.frame.y));
            this._maskTransformComponent.setContentSize(new Size(beforeTransSize.mask.x, beforeTransSize.mask.y));
            this._iconNode.setPosition(v3(beforeTransSize.iconPos.x, beforeTransSize.iconPos.y, 0));
        }

    }

    public updateTransformReelSize(): void {

    }




}


