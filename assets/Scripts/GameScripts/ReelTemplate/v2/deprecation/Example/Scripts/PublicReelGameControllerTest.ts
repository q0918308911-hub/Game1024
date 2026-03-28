import { _decorator, CCFloat, CCInteger, randomRangeInt } from 'cc';
import { SlotMachineController } from '../../Scripts/SlotMachineController';
import { PublicReelConfigTest } from './PublicReelConfigTest';
import { GameController } from 'db://assets/Scripts/GameScripts/Controller';
import { GameMode } from 'db://assets/Scripts/GameScripts/Definition';
import { GenericUIManager } from 'db://assets/Scripts/GameScripts/GenericUI/Scripts';
const { ccclass, property } = _decorator;

const {
    NORMAL_SYMBOLS_LIST,
    MAGNIFICATION_SYMBOLS_LIST,
    ICON_AMOUNT,
} = PublicReelConfigTest;

@ccclass('PublicReelGameControllerTest')
export class PublicReelGameControllerTest extends GameController {
    @property({ type: SlotMachineController, visible: true })
    private _slotMachine: SlotMachineController = null;

    @property(CCFloat)
    private serverDelayTime: number = 1;

    @property({ type: CCInteger, min: -1, visible: true, tooltip: '用來測試聽牌效果' })
    private _readyHandReel: number = 99;

    init(gameMode: GameMode, isOnline: boolean): void {
        super.init(gameMode, isOnline);

        this._slotMachine.init();
        this._slotMachine.allReelRollEndCallBack = this.autoSpin.bind(this);
        GenericUIManager.instance.onStopBtnClickCallback = this.onStopBtnClick.bind(this);
    }

    public onStartSpin(): void {
        super.onStartSpin();
        GenericUIManager.instance.resetMainUIStopBtn();
        this.startSpin();
    }

    public onStartAuto(autoTimes: number): void {
        super.onStartAuto(autoTimes);
        this.autoSpin();
    }

    private autoSpin(): void {
        if (GenericUIManager.instance.checkAutoStatus()) {
            this.startSpin();
        }
        else {
            GenericUIManager.instance.setMainUIToNormalMode();
        }
    }

    private startSpin(reelIDs?: number[]): void {
        GenericUIManager.instance.setMainUIToSpinMode();

        let testData: number[] = this.createTestData(reelIDs);

        let resultData: number[][] = this.handleData(testData);

        let isTurboMode = GenericUIManager.instance.isTurboOn;

        this._slotMachine.startRoll(isTurboMode, reelIDs);

        this.scheduleOnce(() => { // 模擬接收伺服器資料的延遲
            this._slotMachine.setReadyHand(this._readyHandReel);
            this._slotMachine.stopRoll(resultData);
        }, this.serverDelayTime);
    }

    private createTestData(reelIDs: number[] = [0, 1, 2, 3]): number[] {
        let testData: number[] = [];

        for (let index = 0; index < reelIDs.length; index++) {
            let reelID = reelIDs[index];
            testData.push(...this.createSymbolList(reelID));
        }
        console.log(`測試資料: ${testData}`);
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

    private onStopBtnClick(): void {
        this._slotMachine.stopRollCallBack();
    }
}


