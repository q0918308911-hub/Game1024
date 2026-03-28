import { _decorator, CCFloat, CCInteger, Enum, Node, randomRangeInt } from 'cc';
import { PublicReelConfigTest } from '../../../../v2/deprecation/Example/Scripts/PublicReelConfigTest';
import { UniDropSlotMachineExample } from './UniDropSlotMachineExample';
import { GameController } from 'db://assets/Scripts/GameScripts/Controller';
import { GameMode } from 'db://assets/Scripts/GameScripts/Definition';
import { GenericUIManager } from 'db://assets/Scripts/GameScripts/GenericUI/Scripts';
import { Utility } from 'db://assets/Scripts/Utils/Core';
const { ccclass, property } = _decorator;

const {
    NORMAL_SYMBOLS_LIST,
    MAGNIFICATION_SYMBOLS_LIST,
    ICON_AMOUNT,
    REEL_AMOUNT
} = PublicReelConfigTest;

enum SlotType {
    Drop,
    Rolling
}

class FillIconData {
    public removeIconData: number[][] = [];
}

@ccclass('DropUniReelGameControllerTest')
export class UniDropReelGameControllerTest extends GameController {
    @property({ type: UniDropSlotMachineExample, visible: true })
    private _slotMachine: UniDropSlotMachineExample = null;

    @property(CCFloat)
    private serverDelayTime: number = 1;

    @property({ type: CCInteger, min: -1, visible: true, tooltip: '用來測試聽牌效果' })
    private _readyHandReel: number = 99;

    @property(CCInteger)
    private rollingReelIDs: number[] = [0, 1, 2, 3];

    @property({ type: Enum(SlotType) })
    private slotType: SlotType = SlotType.Drop;

    private defaultDropIconIdList: number[][] = [];

    init(gameMode: GameMode, isOnline: boolean): void {
        super.init(gameMode, isOnline);

        this._slotMachine.init();
        this.defaultDropIconIdList = this.generateDefaultDropIconIdList();
        GenericUIManager.instance.onStopBtnClickCallback = this.onStopBtnClick.bind(this);
    }

    public onStartSpin(): void {
        super.onStartSpin();
        GenericUIManager.instance.resetMainUIStopBtn();
        this.startSpin(this.rollingReelIDs);
    }

    public onStartAuto(autoTimes: number): void {
        super.onStartAuto(autoTimes);
        this.autoSpin();
    }

    private async autoSpin(): Promise<void> {
        if (GenericUIManager.instance.checkAutoStatus()) {
            this.startSpin(this.rollingReelIDs);
        }
        else {
            GenericUIManager.instance.setMainUIToNormalMode();
        }
    }

    private async startSpin(reelIDs?: number[]): Promise<void> {
        GenericUIManager.instance.setMainUIToSpinMode();

        let testData: number[] = this.createTestData(reelIDs);
        //let resultData: number[][] = [[3, 3, 0], [4, 2, 5], [1, 0, 5], [9, 10, 12]]; //固定盤面範例
        let resultData: number[][] = this.handleData(testData);
        let isTurboMode = GenericUIManager.instance.isTurboOn;

        let refillDropDataList: FillIconData[] = [];
        refillDropDataList.push(this.generateRefillDropData(3));
        refillDropDataList.push(this.generateRefillDropData(1));
        refillDropDataList.push(this.generateRefillDropData(2));

        if (this.slotType === SlotType.Drop) {
            console.log(this.defaultDropIconIdList);
            await this._slotMachine.startDropOut(isTurboMode, this.defaultDropIconIdList);
        }
        else {
            await this._slotMachine.startRoll(isTurboMode, this.rollingReelIDs);
        }

        await Utility.waitPromise(this.serverDelayTime); // 模擬接收伺服器資料的延遲

        if (this.slotType === SlotType.Drop) {
            await this._slotMachine.startDropIn(this.defaultDropIconIdList, resultData);
        }
        else {
            this._slotMachine.setReadyHand(this._readyHandReel);
            await this._slotMachine.stopRoll(resultData);
        }

        await Utility.waitPromise(0.5);

        while (refillDropDataList.length > 0) {
            const data = refillDropDataList.shift();
            const fillResultData = this.handleFillData(data.removeIconData, resultData);
            await this._slotMachine.startDropRefill(data.removeIconData, fillResultData);
            await Utility.waitPromise(0.5);
        }

        if (GenericUIManager.instance.isAutoMode) {
            await Utility.waitPromise(0.5);
        }

        this.autoSpin();
    }

    private onStopBtnClick(): void {
        this._slotMachine.stopRollCallBack();
    }

    protected generateDefaultDropIconIdList(): number[][] {
        let dropIconIdList: number[][] = [];
        for (let i = 0; i < REEL_AMOUNT; i++) {
            let idList: number[] = [];
            for (let j = 0; j < ICON_AMOUNT; j++) {
                idList.push(j + 1);
            }
            dropIconIdList.push(idList);
        }
        return dropIconIdList;
    }

    protected generateRefillDropData(amount: number): FillIconData {
        let data: FillIconData = new FillIconData();
        for (let index = 0; index < REEL_AMOUNT; index++) {
            const indexList: number[] = [];
            indexList.push(amount);
            data.removeIconData.push(indexList);
        }
        return data;
    }

    private createTestData(reelIDs: number[] = [0, 1, 2, 3]): number[] {
        let testData: number[] = [];

        for (let index = 0; index < reelIDs.length; index++) {
            let reelID = reelIDs[index];
            testData.push(...this.createSymbolList(reelID));
        }

        return testData;
    }

    private createSymbolList(reelID: number): number[] {
        let remainSymbolList = reelID === this._slotMachine.reelAmount - 1 ? [...MAGNIFICATION_SYMBOLS_LIST] : [...NORMAL_SYMBOLS_LIST];
        let uniqueSymbolIDList = reelID === this._slotMachine.reelAmount - 1 ? [...MAGNIFICATION_SYMBOLS_LIST] : [0];
        let resultSymbols: number[] = [];

        for (let index = 0; index < ICON_AMOUNT; index++) {
            let randomIndex: number = randomRangeInt(0, remainSymbolList.length);
            let symbolID: number = remainSymbolList[randomIndex];

            if (uniqueSymbolIDList !== null && uniqueSymbolIDList.includes(symbolID)) {
                let uniqueSymbolIndex = remainSymbolList.indexOf(symbolID);
                remainSymbolList.splice(uniqueSymbolIndex, 1);
            }

            resultSymbols.push(symbolID);
        }

        return resultSymbols;
    }

    private handleData(data: number[]): number[][] {
        let resultData: number[][] = [];

        for (let index = 0; index < this._slotMachine.reelAmount; index++) {
            let iconAmount: number = this._slotMachine.getIconAmount(index);
            resultData[index] = data.slice(index * iconAmount, (index + 1) * iconAmount);
        }

        return resultData;
    }

    private handleFillData(removeIdList: number[][], data: number[][]): number[][] {
        let fillResult: number[][] = Array.from({ length: REEL_AMOUNT }, () => []);
        for (let i = 0; i < removeIdList.length; i++) {
            const reelID = i;
            for (let j = 0; j < removeIdList[i].length; j++) {
                let remainSymbolList = reelID === this._slotMachine.reelAmount - 1 ? [...MAGNIFICATION_SYMBOLS_LIST] : [...NORMAL_SYMBOLS_LIST];
                //fillResult[reelID].push(3); //固定盤面範例
                let randomIndex: number = randomRangeInt(0, remainSymbolList.length);
                let symbolID: number = remainSymbolList[randomIndex];
                fillResult[reelID].push(symbolID);
            }
        }

        return fillResult;
    }
}


