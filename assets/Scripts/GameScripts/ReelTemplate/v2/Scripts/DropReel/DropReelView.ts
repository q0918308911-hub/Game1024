import { _decorator, CCFloat, Component, Node } from 'cc';
import { DropReel } from './DropReel';
import { GameIcon } from '../GameIcon';
import { IconMoveData, RoundMoveData } from './DropReelDataStructure';
import { DropMode, DropState } from '../Model/DropReel/DropReelData';
import { ComponentExt, PrefabList } from 'db://assets/Scripts/Utils/Core';
const { ccclass, property } = _decorator;

@ccclass('DropReelView')
export class DropReelView extends Component {
    @property({ type: Node, visible: true, tooltip: 'icon元件root' })
    protected _iconRoot: Node = null;

    @property({ type: PrefabList, visible: true, tooltip: 'icon元件列表' })
    protected _iconPrefabList: PrefabList[] = [];

    public get iconPrefabList(): PrefabList[] {
        return this._iconPrefabList;
    }

    @property({ type: Node, visible: true, tooltip: '滾輪列表' })
    protected _reelNodeList: Node[] = [];

    @property({ type: CCFloat, min: 0.02, visible: true, tooltip: '滾輪掉落時間間格' })
    protected _delayReelDropTime: number = 0;

    protected get delayReelDropTime(): number {
        if (this._delayReelDropTime <= 0) {
            return 0;
        }
        else if (this._delayReelDropTime > 0 && this._delayReelDropTime < 0.03) {
            return 0.03;
        }
        else {
            return this._delayReelDropTime;
        }
    }

    @property({ visible: true, tooltip: '將Icon重新命名為GameIcon[reelID][iconID]' })
    protected _debugRenameIcon: boolean = false;

    public showReadyHand: (reelId: number) => void = null;
    public hideReadyHand: (reelId: number) => void = null;

    protected _reels: DropReel[] = [];

    public get reelAmount(): number {
        return this._reels.length;
    }

    protected _nodeComponentMap: Map<Node, GameIcon> = new Map();
    protected _resultSymbolData: number[][] = [];
    public set resultSymbolData(value: number[][]) {
        this._resultSymbolData = value;
    }

    public getIconAmount(reelID: number): number {
        return this.iconPrefabList[reelID].nodeList.length;
    }

    protected _roundMoveData: RoundMoveData = new RoundMoveData();
    public get roundMoveData(): RoundMoveData {
        return this._roundMoveData;
    }

    protected _isStopButtonPressed: boolean = false;
    public set isStopButtonPressed(value: boolean) {
        this._isStopButtonPressed = value;
    }

    public init(): void {
        this._reels = ComponentExt.getComps<DropReel>(this._reelNodeList, 'DropReel');
        this.createIcon();
        this.initIcon();
        this.initReel();

    }

    protected createIcon(): void {
        for (let i = 0; i < this._iconPrefabList.length; i++) {
            this._iconPrefabList[i].createInstance(this._reels[i].rootNode, this.iconPrefabList[i].count);
        }
    }

    protected initIcon() {
        for (let i = 0; i < this._iconPrefabList.length; i++) {
            for (let j = 0; j < this._iconPrefabList[i].nodeList.length; j++) {
                const iconNode = this._iconPrefabList[i].nodeList[j];
                const iconComponent = ComponentExt.getComp<GameIcon>(this._iconPrefabList[i].nodeList[j], 'GameIcon');
                this._nodeComponentMap.set(iconNode, iconComponent);
                iconComponent.init();

                if (this._debugRenameIcon) {
                    iconNode.name = 'GameIcon' + i + j;
                }
            }
        }
    }

    protected initReel(): void {
        for (let index = 0; index < this._reels.length; index++) {
            this._reels[index].init(index, this._iconPrefabList[index].nodeList);
        }
    }

    public setRoundResult(data: RoundMoveData): void {
        for (let reelID = 0; reelID < data.roundIconMoveData.length; reelID++) {
            this.setReelResult(data.getReelMoveDataByIndex(reelID), reelID);
        }
    }

    public setReelResult(data: IconMoveData[], reelID: number): void {
        if (data.length !== this._resultSymbolData[reelID].length) {
            console.error('結果資料數與消除的Icon數不相符 ReelID = ' + reelID
                + " 消除個數 = " + data.length
                + "補排資料為 = " + this._resultSymbolData[reelID]);
        }

        for (let i = 0; i < data.length; i++) {
            let iconComponent = this._nodeComponentMap.get(data[i].node);
            iconComponent.updateSymbol(this._resultSymbolData[reelID][i]);
        }
    }

    public getIconCount(reelID: number) {
        return this._iconPrefabList[reelID].count;
    }

    // 按下Stop後快速停止未完成的Reel
    public stopDrop(): void {
        this.setReelMode(DropMode.STOP);
    }

    public setReelMode(mode: DropMode, reelID?: number): void {
        if (reelID === undefined) {
            for (let i = 0; i < this._reels.length; i++) {
                this._reels[i].curMode = mode;
            }
        }
        else {
            this._reels[reelID].curMode = mode;
        }
    }

    // 整個 startDropWithDelayPromise() 完成 = 每一輪OneReelDropPromise完成
    public async startDrop(state: DropState, data: RoundMoveData) {
        let promiseList = [];
        for (let i = 0; i < this.reelAmount; i++) {
            let delateTime = data.checkIfReelHasIconNeedToMove(i) ? this.delayReelDropTime : 0;
            if (!this._isStopButtonPressed && i !== 0) {
                await this.delay(delateTime);
            }
            let promise = this.OneReelDropPromise(state, data.getReelMoveDataByIndex(i), i);
            promiseList.push(promise);
        }
        await Promise.all(promiseList);
    }

    protected delay(seconds: number): Promise<void> {
        return new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000));
    }

    public async OneReelDropPromise(state: DropState, data: IconMoveData[], reelID: number): Promise<void> {

        // 如果DropIn 先重設Result
        if (state === DropState.DROP_IN) {
            this.setReelResult(data, reelID);
        }

        await this._reels[reelID].startDropTween(data, state);

        // 如果DropOut 會重設為置到最上方，準備DropIn
        if (state === DropState.DROP_OUT) {
            this._reels[reelID].resetDropOutIconPos(data);
        }
    }

    /**
     * @param removeData 要表演消除動畫的資料
     * 可以需求自行改寫
     * 預設number[][]給原本的Icon直接使用，number[]給表演層Icon使用
     */
    public async showRemoveIconAnim(removeData: number[][] | number[]) {
        return new Promise<void>((resolve) => setTimeout(resolve, 1 * 1000));
    }

    public resetToTop(roundData: RoundMoveData) {
        for (let i = 0; i < roundData.roundIconMoveData.length; i++) {
            let reelMoveData = roundData.getReelMoveDataByIndex(i);
            this._reels[i].resetDropOutIconPos(reelMoveData);
        }
    }
}


