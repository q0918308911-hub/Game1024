import { _decorator, CCFloat, CCInteger, randomRangeInt } from 'cc';
import { UniSlotMachineExample } from './UniSlotMachineExample';
import { PublicReelConfigTest } from '../../../../v2/Example/Scripts/PublicReelConfigTest';
import { GameController } from 'db://assets/Scripts/GameScripts/Controller';
import { GameMode } from 'db://assets/Scripts/GameScripts/Definition';
import { GenericUIManager } from 'db://assets/Scripts/GameScripts/GenericUI/Scripts';

const { ccclass, property } = _decorator;

const {
    NORMAL_SYMBOLS_LIST,
    MAGNIFICATION_SYMBOLS_LIST,
    ICON_AMOUNT,
} = PublicReelConfigTest;

@ccclass('UniReelGameControllerTest')
export class UniReelGameControllerTest extends GameController {
    @property({ type: UniSlotMachineExample, visible: true })
    private _slotMachine: UniSlotMachineExample = null;

    @property(CCFloat)
    private serverDelayTime: number = 1;

    @property({ type: CCInteger, min: -1, visible: true, tooltip: '用來測試聽牌效果' })
    private _readyHandReel: number = 99;

    @property(CCInteger)
    private rollingReelIDs: number[] = [0, 1, 2, 3];

    init(gameMode: GameMode, isOnline: boolean): void {
        super.init(gameMode, isOnline);

        this._slotMachine.init();
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

        let resultData: number[][] = this.handleData(testData);

        console.log(resultData);

        let isTurboMode = GenericUIManager.instance.isTurboOn;

        console.log('reel start');

        this._slotMachine.startRoll(isTurboMode, reelIDs);

        await this.delay(this.serverDelayTime); // 模擬接收伺服器資料的延遲

        this._slotMachine.setReadyHand(this._readyHandReel);
        await this._slotMachine.stopRoll(resultData);

        console.log('reel stop');

        if (GenericUIManager.instance.isAutoMode) {
            await this.delay(0.5);
        }

        this.autoSpin();
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

    private onStopBtnClick(): void {
        this._slotMachine.stopRollCallBack();
    }

    protected delay(time: number): Promise<void> {
        return new Promise<void>((resolve) => {
            this.scheduleOnce(() => {
                resolve();
            }, time);
        });
    }
}