import { _decorator, Component } from 'cc';
import { DropReelView } from './DropReelView';
import { IconMoveData, GameDropResultData, RoundMoveData, RoundRemoveData } from './DropReelDataStructure';
import { DropMode, DropState } from '../Model/DropReel/DropReelData';
const { ccclass, property } = _decorator;

@ccclass('DropSlotMachineController')
export class DropSlotMachineController extends Component {
    @property(DropReelView)
    protected view: DropReelView = null;

    public showReadyHand: (reelId: number) => void = null;
    public hideReadyHand: (reelId: number) => void = null;

    public oneReelRollEndCallBack: (reelID: number) => void = null;
    public allReelRollEndCallBack: Function = null;

    protected serverCallback: Function = null;
    protected isPerformResult: boolean = false;

    protected defaultMoveCount: number = 0;
    protected defaultResetCount: number = 0;
    protected roundMoveData: RoundMoveData = new RoundMoveData();
    protected fillingData: RoundMoveData = new RoundMoveData();
    protected reDropData: RoundMoveData = new RoundMoveData();

    protected totalRoundRemoveData: RoundRemoveData[] = []; // now fake

    public init(): void {
        this.view = this.view as DropReelView;
        this.initView();
        this.initDropData();
        this.setInitResult();
    }

    protected initView(): void {
        this.view.init();
        this.view.showReadyHand = this.showReadyHand;
        this.view.hideReadyHand = this.hideReadyHand;
    }

    /**
     * 初始化掉落式滾輪使用的資料格式
     */
    protected initDropData(): void {
        this.defaultMoveCount = this.view.iconPrefabList[0].count;
        this.defaultResetCount = this.defaultMoveCount * 2; // 預備掉落位置為掉落距離的兩倍
        for (let i = 0; i < this.view.reelAmount; i++) {
            let reelMoveData: IconMoveData[] = [];
            for (let j = 0; j < this.view.getIconAmount(i); j++) {
                let node = this.view.iconPrefabList[i].nodeList[j];
                let nodeMoveData = new IconMoveData(node, this.defaultMoveCount, this.defaultResetCount);
                reelMoveData.push(nodeMoveData);
            }
            this.roundMoveData.addReelMoveData(reelMoveData);
        }
    }

    protected setInitResult(): void {
        let initSymbolData = this.generateInitIconData();
        this.view.resultSymbolData = initSymbolData;
        this.view.setRoundResult(this.roundMoveData);
    }

    protected generateInitIconData(): number[][] {
        let iconData: number[][] = [];
        for (let i = 0; i < this.view.reelAmount; i++) {
            let iconCount = this.view.getIconCount(i);
            iconData[i] = [];
            for (let j = 0; j < iconCount; j++) {
                iconData[i][j] = 2;
            }
        }
        return iconData;
    }

    // 這是滾輪時間到 DropIn
    public stopDrop(resultData: GameDropResultData): void {
        this.view.resultSymbolData = resultData.firstRoundData;
        this.totalRoundRemoveData = resultData.roundRemoveDataList;
        this.serverCallback?.();
    }

    // public resultUpdate(resultData: GameDropResultData): void {
    //     this.view.resultSymbolData = resultData.firstRoundData;
    //     this.totalRoundRemoveData = resultData.roundRemoveDataList;
    //     this.serverCallback?.();
    // }

    // 這是Stop button的callback
    public stopRollCallBack(): void {
        if (this.isPerformResult) { // resultDisplay不讓按stop跳過，可依遊戲需求調整
            return;
        }

        this.view.isStopButtonPressed = true;
    }

    public async startDrop(isTurbo: boolean): Promise<void> {
        this.reelModeSetting(isTurbo);

        // 等待滾全輪掉落出去，並等待server回傳資料 ( 缺一不可 )
        await Promise.all([
            this.view.startDrop(DropState.DROP_OUT, this.roundMoveData),
            this.waitServerPromise()
        ]);

        // 等待滾輪重新掉落回來補盤面
        await this.view.startDrop(DropState.DROP_IN, this.roundMoveData);

        this.resultDisplaySetting();
        await this.totalResultDisplay();

        this.onEnd();
    }

    protected reelModeSetting(isTurbo: boolean) {
        if (isTurbo) {
            this.view.setReelMode(DropMode.TURBO);
        } else {
            this.view.setReelMode(DropMode.IDLE);
        }
    }

    protected waitServerPromise(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.serverCallback = resolve;
        });
    }

    /**
     * 要開始表演消除盤面的前設置，可依遊戲需求調整
     */
    protected resultDisplaySetting() {
        this.view.isStopButtonPressed = false;
        this.isPerformResult = true; // resultDisplay不讓按stop跳過
        // 重設表演速度，讓Result表演速度變回一般
        this.view.setReelMode(DropMode.IDLE);
    }

    /**
     * 消除結果分次顯示，每次包含每盤消除 + 補盤面到完整
     */
    protected async totalResultDisplay() {
        for (let i = 0; i < this.totalRoundRemoveData.length; i++) {
            this.calculateDropDownData(this.totalRoundRemoveData[i]);
            await this.view.showRemoveIconAnim(this.totalRoundRemoveData[i].removeIconData);
            this.view.resetToTop(this.reDropData); //使用重置距離將被削除的Icon位子重置到上方預備掉落
            await this.displayRoundResult();
            this.resetRoundMoveData(); // 將兩份資料合併成目前最新的盤面資料
        }
    }

    protected calculateDropDownData(roundRemoveData: RoundRemoveData) {
        this.generateDropDownData(roundRemoveData.removeIconData);
        this.view.resultSymbolData = roundRemoveData.newIconData; // 更新要替換的結果
        this.updateDropDownDataCount(this.fillingData); // 更新補盤面移動的距離
        this.updateDropDownDataCount(this.reDropData, true); // 更新重置距離與掉落距離
    }

    protected async displayRoundResult() {
        await this.view.startDrop(DropState.FILL, this.fillingData); // 開始補盤面
        await this.view.startDrop(DropState.DROP_IN, this.reDropData); // Icon更新結果並掉落進來補滿盤面
    }

    /**
     * 將原有資料分開成兩份，一份為fillingData，一份為reDropData
     * @param roundRemoveData 要消除的資料
     * @returns fillingData 仍留在盤面上，準備要掉落填補空缺的資料
     * @returns reDropData 被消除後，要移到上面並更換結果重新掉落的資料
     */
    protected generateDropDownData(roundRemoveData: number[][]) {
        for (let i = 0; i < roundRemoveData.length; i++) {
            let originalData = this.roundMoveData.getReelMoveDataByIndex(i);
            let fillingDataInReel = [...this.roundMoveData.getReelMoveDataByIndex(i)];
            let reDropDataInReel = [];
            for (let j = 0; j < roundRemoveData[i].length; j++) {
                let removeDataIndex = roundRemoveData[i][j];
                let targetData = originalData[removeDataIndex]; // 要消除的Node
                fillingDataInReel.remove(targetData);
                reDropDataInReel.push(targetData);
            }

            this.fillingData.roundIconMoveData[i] = fillingDataInReel;
            this.reDropData.roundIconMoveData[i] = reDropDataInReel;
        }
    }

    /**
     * 更新資料要移動或重置的距離(Count): 
     * - 若為fillIconData (!isReset) => moveCount = 舊資料(roundMoveData)掉落順序 - 新資料(fillData)掉落順序
     * - 若為resetIconData (isReset) => moveCount = 每個Reel有幾個NodeData的長度
     * - resetCount = 原完整盤面長度 - 舊資料(roundMoveData)掉落順序 + 新資料(reDropData)的掉落順序
     */
    protected updateDropDownDataCount(dropData: RoundMoveData, isReset = false): void {
        this.roundMoveData.generateReverseOrderIndexList();
        dropData.generateReverseOrderIndexList();

        for (let i = 0; i < dropData.roundIconMoveData.length; i++) {
            let targetReelData = dropData.roundIconMoveData[i];

            for (let j = 0; j < targetReelData.length; j++) {
                const targetNodeData = targetReelData[j];
                const originalDropOrder = this.roundMoveData.getReverseOrderIndex(targetNodeData, i);
                const newDropOrder = dropData.getReverseOrderIndex(targetNodeData, i);
                let newCount: number = 0;

                if (isReset) {
                    // 預設每輪都是相同Icon個數
                    newCount = this.view.getIconAmount(0) - originalDropOrder + newDropOrder;
                    targetNodeData.resetCount = newCount;
                    targetNodeData.moveCount = targetReelData.length;
                }
                else {
                    newCount = originalDropOrder - newDropOrder;
                    targetNodeData.moveCount = newCount;
                }
            }
        }
    }

    protected onEnd() {
        this.isPerformResult = false;
        this.view.isStopButtonPressed = false;
        this.resetDropCount();
        this.allReelRollEndCallBack?.();
    }

    protected resetDropCount() {
        this.roundMoveData.roundMoveCount = this.defaultMoveCount
        this.roundMoveData.roundResetCount = this.defaultResetCount;
    }

    protected resetRoundMoveData() {
        for (let i = 0; i < this.reDropData.roundIconMoveData.length; i++) {
            for (let j = 0; j < this.fillingData.roundIconMoveData[i].length; j++) {
                this.reDropData.roundIconMoveData[i].push(this.fillingData.roundIconMoveData[i][j]);
            }
        }
        this.roundMoveData.roundIconMoveData = [...this.reDropData.roundIconMoveData];
    }
}
