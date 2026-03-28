import { _decorator, CCInteger, Component, Layout, Node, UITransform, v3, Vec3 } from 'cc';
import { ReelDataBase, rollDirection } from './Model/ReelDataBase';
import { ReelEvent, ReelState } from './Model/ReelData';

const { ccclass, property } = _decorator;

@ccclass('ReelBase')
export abstract class ReelBase extends Component {
    @property({ type: CCInteger, readonly: true, visible: true, tooltip: '第幾個滾輪' })
    protected _reelID: number = 0;

    @property({ type: Node, visible: true, tooltip: '執行滾輪的節點' })
    protected _rootNode: Node = null;

    @property({ type: ReelDataBase, visible: true, tooltip: '滾輪資料' })
    protected _reelData: ReelDataBase = null;

    public set reelID(value: number) {
        this._reelID = value;
    }

    public get reelID(): number {
        return this._reelID;
    }

    public get rootNode(): Node {
        return this._rootNode;
    }

    protected _iconAmount: number = 0;
    protected _havePrepareIcon: boolean = false;

    //滾輪方向與目的地
    protected _currentDirUnit: number[] = [];

    public get currentDirUnit(): number[] {
        return this._currentDirUnit;
    }

    protected _isVertical: boolean = false;

    protected _unitDis: number = 0;

    public get unitDis(): number {
        return this._unitDis;
    }

    protected _rollDis: number = 0;
    protected _iconStartPos: number = 0;
    protected _upOrRightUnit: number = 0;

    //紀錄所有icon位置
    protected _iconPos: Vec3[] = [];

    public get iconPos(): Vec3[] {
        return this._iconPos;
    }

    //滾輪狀態與發送事件
    protected _currentState: ReelState = ReelState.Unknown;

    protected set currentState(state: ReelState) {
        if (this._currentState !== state) {
            this._currentState = state;
        }
    }

    public get currentState(): ReelState {
        return this._currentState;
    }

    public onReelEvent: (reelID: number, state: ReelEvent) => void = null;

    /**
     * 滾輪之前的設定，在執行滾輪前呼叫
     * @param reelRoundState 滾輪整輪的狀態，類型定義成number，可以自己寫enum傳進來，方便改寫
     * @param showIconData startPull或是bounceIcon的symbolData
     */
    public abstract rollSetting(reelRoundState: number, showSymbolID?: number): void;

    /**
     * 執行一次滾輪
     */
    public abstract startOneRoundRoll(): void;

    public init(reelID: number, iconNodes: Node[], havePrepareIcon: boolean): void {
        this._reelID = reelID;
        this._havePrepareIcon = havePrepareIcon;
        this._iconAmount = this._havePrepareIcon ? iconNodes.length / 2 : iconNodes.length;

        let rollDirUnit: number[][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        this._currentDirUnit = rollDirUnit[this._reelData.reelDir];
        this._isVertical = this._reelData.reelDir === rollDirection.Up || this._reelData.reelDir === rollDirection.Down;
        this._upOrRightUnit = this._reelData.reelDir === rollDirection.Up || this._reelData.reelDir === rollDirection.Right ? -1 : 1;

        let iconSize = iconNodes[0].getComponent(UITransform).contentSize;
        this._unitDis = this._isVertical ? iconSize.y + this._reelData.iconSpacing : iconSize.x + this._reelData.iconSpacing;
        this._rollDis = this.unitDis * this._iconAmount;

        if (this._reelData.useLayout) {
            this.setLayOutForIconPos(iconNodes.length);

            for (let index = 0; index < iconNodes.length; index++) {
                this.iconPos.push(iconNodes[index].getPosition());
            }
        }
        else {
            this.calculateIconStartPos();
            this.calculateInitIconPos(iconNodes.length);
            this.initIconPos(iconNodes);
        }
    }

    protected calculateIconStartPos(): void {
        let startPos: number = (this._iconAmount / 2 - 1) * this.unitDis + (this.unitDis / 2);
        startPos += this._havePrepareIcon ? this._rollDis : 0;

        this._iconStartPos = this._isVertical ? -this._currentDirUnit[1] * startPos : -this._currentDirUnit[0] * startPos;
    }

    protected setLayOutForIconPos(iconInReelAmount: number): void {
        let layout: Layout = this.rootNode.addComponent(Layout);

        if (this._isVertical) {
            layout.type = Layout.Type.VERTICAL;
            layout.verticalDirection = this._reelData.reelDir ===
                rollDirection.Up ? Layout.VerticalDirection.BOTTOM_TO_TOP : Layout.VerticalDirection.TOP_TO_BOTTOM;

            layout.spacingY = this._reelData.iconSpacing;

            if (this._havePrepareIcon) {
                let paddingTop = this.unitDis * (iconInReelAmount / 2) * -this._upOrRightUnit;
                layout.paddingTop = paddingTop;
            }
        }
        else {
            layout.type = Layout.Type.HORIZONTAL;
            layout.horizontalDirection = this._reelData.reelDir ===
                rollDirection.Right ? Layout.HorizontalDirection.LEFT_TO_RIGHT : Layout.HorizontalDirection.RIGHT_TO_LEFT;

            layout.spacingX = this._reelData.iconSpacing;

            if (this._havePrepareIcon) {
                let paddingLeft = this.unitDis * (iconInReelAmount / 2) * this._upOrRightUnit;
                layout.paddingLeft = paddingLeft;
            }
        }

        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        layout.updateLayout();

        this.scheduleOnce(() => { // 等一禎讓layout更新完再關閉
            layout.enabled = false;
        }, 0);
    }

    protected calculateInitIconPos(iconInReelAmount: number): void {
        for (let index = 0; index < iconInReelAmount; index++) {
            let newPos: Vec3 = this.calculateIconPos(index);
            this._iconPos.push(newPos);
        }
    }

    protected calculateIconPos(iconIndex: number): Vec3 {
        let offset: number = this.unitDis * iconIndex;
        let finalPos: number = (this._iconStartPos * this._upOrRightUnit - offset) * this._upOrRightUnit;
        let newPos: Vec3 = this._isVertical ? v3(0, finalPos, 0) : v3(finalPos, 0, 0);

        return newPos;
    }

    protected initIconPos(iconNodes: Node[]): void {
        for (let index = 0; index < iconNodes.length; index++) {
            iconNodes[index].setPosition(this._iconPos[index]);
        }
    }
}