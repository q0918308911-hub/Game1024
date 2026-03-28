import { _decorator, Component, Vec2, Node, Prefab, instantiate, UITransform, Size } from 'cc';
import { ContentSizeDef } from './ContentSizeDef';
import { ITransWildReelInfo } from '../../DefinitionGameData1024/GameConfigInstance1024';
import { TransIconComponent } from './TransIconComponent';

const { ccclass, property } = _decorator;

@ccclass('TransReelAniComponentCtrl')
export class TransReelAniComponentCtrl extends Component {


    @property({ type: [ContentSizeDef], visible: true, displayName: 'TransMaskSizeList', tooltip: '變形contentSize大小' })
    private _transMaskSizeList: ContentSizeDef[] = [];

    @property({ type: [ContentSizeDef], visible: true, displayName: 'TransFrameSizeList', tooltip: '變形contentSize大小' })
    private _transFrameSizeList: ContentSizeDef[] = [];

    @property({ type: [ContentSizeDef], visible: true, displayName: 'TransIconPosList', tooltip: '變形icon位置座標' })
    private _transIconPosList: ContentSizeDef[] = [];

    //--塞入特殊軸---改變中心點的node(中心點在下面)
    @property({ type: [Node], visible: true, displayName: 'TransFrameANINode', tooltip: '變形表演使用的node' })
    private _transFrameANINode: Node[] = [];

    @property({ type: Prefab, visible: true, displayName: 'TransIconPrefab-TEST', tooltip: '變形icon prefab-TEST' })
    private _transIconPrefab: Prefab = null;

    @property({ type: Prefab, visible: true, displayName: 'TransWILDPrefab-TEST', tooltip: '變形 wild prefab-TEST' })
    private _transWILDPrefab: Prefab = null;

    //--icon數量 對應 icon尺寸
    private _sizeMap: Map<number, Vec2> = new Map<number, Vec2>();
    //--<變形後>該次補牌後該軸預計的最大長度
    private _reelMaxLen: number = 2;
    //--<變形前>抽取變形軸對應的index(要去map裡面取出對應的size vec2)
    private _initBeforeTransIndex: number = 0;

    /*
    set initBeforeTransIndex(index: number) {
        this._initBeforeTransIndex = index;
    }

    set reelMaxLen(len: number) {
        this._reelMaxLen = len;
    }*/

    private _mapTransMaskSize: Map<number, { frame: Vec2, mask: Vec2, iconPos: Vec2 }> = new Map();

    protected onLoad(): void {
        console.log();
        this.init();
    }

    public init(): void {
        //--init mapData
        const len = this._transFrameSizeList.length;

        for (let i = 0; i < len; i++) {

            const key = parseInt(this._transFrameSizeList[i].key);
            if (!this._mapTransMaskSize.has(key)) {
                const frameSize = this._transFrameSizeList[i].size;
                const maskSize = this._transMaskSizeList[i].size;
                const iconPos = this._transIconPosList[i].size;
                this._mapTransMaskSize.set(key, { frame: frameSize, mask: maskSize, iconPos: iconPos });
            }
        }

        this._sizeMap = new Map<number, Vec2>([
            [2, new Vec2(150, 210)],
            [3, new Vec2(150, 140)],
            [4, new Vec2(150, 104)],
            [5, new Vec2(150, 84)],
            [6, new Vec2(150, 70)],
            [7, new Vec2(150, 60)]
        ]);
        console.log();
    }


    //---要在初始化產生前設定layout
    public setLayoutBeforeUpdate(initBeforeTransIndex: number): void {
        this._initBeforeTransIndex = initBeforeTransIndex;
    }

    //--這個要在wild補進來之前呼叫
    public setReelMaxLen(len: number): void {
        this._reelMaxLen = len;//--整軸補牌新增後的總長度
    }


    public addWildIcon(lens: number): void {

        const targetReel = this._transFrameANINode[0];
        for (let i: number = 0; i < lens; i++) {
            const wildNode = instantiate(this._transWILDPrefab);
            const comp: TransIconComponent = wildNode.getComponent(TransIconComponent);
            comp.symbolId = 9;
            targetReel.addChild(wildNode);
            comp.setWildSprIconBeforeUpdate(this._reelMaxLen);
            const targetSize = this._sizeMap.get(this._initBeforeTransIndex);
            comp.layoutWildBeforeUpdate(targetSize);
            const startY_Index = this._testIcons.length;
            const startY = (startY_Index * targetSize.y) + targetSize.y / 2;
            wildNode.setPosition(0, startY, 0);
            this._testIcons.push(wildNode);
            //const startY = (i * targetSize.y) + targetSize.y / 2;
            //iconNode.setPosition(0, startY, 0);
            //this._testIcons.push(iconNode);
        }
        //---手動更新contentSize---
        const targetCountSize = this._sizeMap.get(this._initBeforeTransIndex);
        const uiTrans = targetReel.getComponent(UITransform);
        uiTrans.setContentSize(new Size(targetCountSize.x, targetCountSize.y * this._testIcons.length));
        console.log();
    }

    private _testIcons: Node[] = [];
    public test(): void {

        //this.setLayoutBeforeUpdate(beforeLayoutIndex);

        const targetReel = this._transFrameANINode[0];
        //--從下面開始往上擺
        for (let i: number = 0; i < 2; i++) {
            const iconNode = instantiate(this._transIconPrefab);
            const comp: TransIconComponent = iconNode.getComponent(TransIconComponent);
            comp.symbolId = 0;
            targetReel.addChild(iconNode);
            //comp.setTransformReelTarget(this._reelMaxLen, this._mapTransMaskSize.get(this._reelMaxLen));
            comp.layoutBeforeUpdate(this._mapTransMaskSize.get(this._initBeforeTransIndex));
            const targetSize = this._sizeMap.get(this._initBeforeTransIndex);

            const startY = (i * targetSize.y) + targetSize.y / 2;
            iconNode.setPosition(0, startY, 0);
            this._testIcons.push(iconNode);

        }
        //--for test---
        this.setReelMaxLen(6);
        this.addWildIcon(3);
    }


    //--這邊要塞入wPos要仿製的icon座標
    public createAllIcon(): void {


    }

    //---初始化前的layout設定
    private initLayout(): void {

    }





}