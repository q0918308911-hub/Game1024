import { _decorator, randomRangeInt, } from 'cc';
import { SlotMachineControllerBase } from './SlotMachineControllerBase';
import { SlotMachineData } from './Model/SlotMachineData';
import { IconReelView } from './IconReelView';
import { ReelRoundState } from './Model/ReelData';

const { ccclass, property } = _decorator;

@ccclass('IconSlotMachine')
export class IconSlotMachine extends SlotMachineControllerBase {
    @property({ type: SlotMachineData, visible: true })
    protected _slotMachineData: SlotMachineData = null;

    public showReadyHandCallback: (reelId: number) => void = null;
    public hideReadyHandCallback: (reelId: number) => void = null;

    public oneReelRollEndCallBack: (reelID: number) => void = null;
    public allReelRollEndCallBack: () => void = null;

    protected _reelView: IconReelView = null;

    protected _iconResultDataIndex: number = 0;

    public get reelAmount(): number {
        return this._reelView.reelAmount;
    }

    protected _previousResultData: number[][] = []; //儲存上一輪的資料

    protected _currentRollingReelIDs: number[] = []; //紀錄當前滾動的滾輪ID

    public init(): void {
        this._reelView = this._view as IconReelView;
        this.initView();
        this._slotMachineData.init(this.reelAmount);
        this.initIconSymbol();
    }

    public override startRoll(isTurboMode: boolean, reelIDs?: number[]): void {
        super.startRoll(isTurboMode, reelIDs);
        this._currentRollingReelIDs = this._reelView.currentRollingReelIDs;
    }

    public setReadyHand(reelID: number): void {
        if (reelID >= 0) {
            this._reelView.currentReadyHandReelID = reelID;
        }
    }

    public getIconAmount(reelID: number): number {
        let iconAmount: number = this._reelView.getIconAmount(reelID);
        return iconAmount;
    }

    public stopRollCallBack(): void {
        this._isStopClick = true;

        if (this._isReceiveData) {
            this._reelView.fastStopRoll();
        }
    }

    protected initView(): void {
        this._reelView.isFastModeCallback = this.isFastMode.bind(this);

        this._reelView.showReadyHandCallback = this.showReadyHand.bind(this);
        this._reelView.hideReadyHandCallback = this.hideReadyHand.bind(this);

        this._reelView.getIconDataCallback = this.sendIconData.bind(this);
        this._reelView.getNextRoundDataCallback = this.sendNextRoundData.bind(this);

        this._reelView.oneReelRollEndCallback = this.oneReelRollEnd.bind(this);
        this._reelView.allReelRollEndCallback = this.allReelRollEnd.bind(this);

        this._reelView.init();
    }

    protected initIconSymbol(): void {
        let haveInitData: boolean = this._slotMachineData.initSymbolList.length > 0;
        let initSymbolData = haveInitData ? [...this._slotMachineData.initSymbolList] : this.generateInitIconData();
        this._reelView.initIconSymbol(initSymbolData);
    }

    /**
     * 隨機產生初始盤面
     * @returns 初始盤面
     */
    protected generateInitIconData(): number[][] {
        let iconData: number[][] = [];
        for (let reelID = 0; reelID < this._reelView.reelAmount; reelID++) {
            iconData[reelID] = this.generateRandomIconData(reelID);
        }

        this._previousResultData = iconData;
        return iconData;
    }

    /**
    * 產生滾輪要顯示的icon
    * @param reelID 滾輪ID
    * @returns number[] 要顯示的icon
    */
    protected sendIconData(reelID: number): number[] {
        let iconData: number[] = [];
        let reelState: ReelRoundState = this._reelView.reelStateList[reelID];
        let isFinal: boolean = reelState === ReelRoundState.FinalRoll && this._isReceiveData;

        if (isFinal) {
            iconData = [...this._iconResultData[this._iconResultDataIndex]];
            this._iconResultDataIndex++;
        }
        else {
            iconData = this.generateRandomIconData(reelID, this._previousResultData[reelID]);
        }

        this._previousResultData[reelID] = [...iconData];

        return iconData;
    }

    /**
    * 最後一輪要先產生下一輪的資料才能執行回彈
    * @param reelID 滾輪ID
    * @returns 下一輪顯示的icon
    */
    protected sendNextRoundData(reelID: number): number[] {
        let index = this._currentRollingReelIDs.indexOf(reelID);
        let resultData = [...this._iconResultData[index]];

        let nextResultData = this.generateRandomIconData(reelID, resultData); // 預先產生下一輪的icon是因為要先執行回彈
        this._previousResultData[reelID] = [...nextResultData];
        return nextResultData;
    }

    protected reset(): void {
        super.reset();
        this._iconResultDataIndex = 0;
    }

    /** 
 * 滾輪要換圖的時候呼叫，長度為iconAmount，變化大，請自行改寫
 * @param reelID 第幾個滾輪
 * @param reelState 目前滾輪的狀態
 * @param previousIcons 前一局的盤面 
 */
    protected generateRandomIconData(reelID: number, previousIcons?: number[]): number[] {
        let allSymbolList = this._slotMachineData.getAllSymbols(reelID);
        let uniqueSymbolIDList: number[] = this._slotMachineData.getUniqueSymbols(reelID);
        let noSameReelSymbolList: number[] = this._slotMachineData.getNoSameReelSymbols(reelID);

        let resultSymbols: number[] = [];
        let iconAmount = this.getIconAmount(reelID);

        for (let index = 0; index < iconAmount; index++) {
            let randomIndex: number = randomRangeInt(0, allSymbolList.length);
            let symbolID: number = allSymbolList[randomIndex];

            if (uniqueSymbolIDList.length > 0 && uniqueSymbolIDList.includes(symbolID)) {
                let uniqueSymbolIndex = allSymbolList.indexOf(symbolID);
                allSymbolList.splice(uniqueSymbolIndex, 1);
            }

            if (noSameReelSymbolList.includes(symbolID)) {
                for (let index = 0; index < noSameReelSymbolList.length; index++) {
                    const noSameSymbol = noSameReelSymbolList[index];
                    let noSameReelSymbolIndex = allSymbolList.indexOf(noSameSymbol);
                    allSymbolList.splice(noSameReelSymbolIndex, 1);
                }
            }

            resultSymbols.push(symbolID);
        }

        return resultSymbols;
    }

    protected oneReelRollEnd(reelID: number): void {
        this.oneReelRollEndCallBack?.(reelID);
    }

    protected allReelRollEnd(): void {
        this.allReelRollEndCallBack?.();
    }

    protected showReadyHand(reelID: number): void {
        this.showReadyHandCallback?.(reelID);
    }

    protected hideReadyHand(reelID: number): void {
        this.hideReadyHandCallback?.(reelID);
    }
}