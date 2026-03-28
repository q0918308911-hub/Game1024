import { _decorator, CCFloat, CCInteger, Component, Node, randomRangeInt } from 'cc';
import { UniSlotMachineExample } from '../Reel/UniSlotMachineExample';
import { PublicReelConfigTest } from '../../../../v2/Example/Scripts/PublicReelConfigTest';
import { SimpleUI } from './SimpleUI';
const { ccclass, property } = _decorator;

const {
    NORMAL_SYMBOLS_LIST,
    MAGNIFICATION_SYMBOLS_LIST,
    ICON_AMOUNT,
} = PublicReelConfigTest;

@ccclass('GameControllerSimple')
export class GameControllerSimple extends Component {
    @property(SimpleUI)
    private simpleUI: SimpleUI = null;

    @property({ type: UniSlotMachineExample, visible: true })
    private slotMachine: UniSlotMachineExample = null;

    @property(CCFloat)
    private serverDelayTime: number = 1;

    @property({ type: CCInteger, min: -1, visible: true, tooltip: '用來測試聽牌效果' })
    private readyHandReel: number = 99;

    @property(CCInteger)
    private rollingReelIDs: number[] = [0, 1, 2, 3];

    protected start(): void {
        this.simpleUI.onSpinBtnClickCallback = this.onSpinBtnClick.bind(this);
        this.simpleUI.onAutoBtnClickCallback = this.onAutoBtnClick.bind(this);
        this.simpleUI.onTurboBtnClickCallback = this.onTurboBtnClick.bind(this);
        this.simpleUI.onStopBtnClickCallback = this.onStopBtnClick.bind(this);

        this.slotMachine.init();
    }

    public onSpinBtnClick(): void {
        this.startSpin(this.rollingReelIDs);
    }

    public onAutoBtnClick(): void {
        this.autoSpin();
    }

    public onTurboBtnClick(): void {

    }

    private async autoSpin(): Promise<void> {
        if (this.simpleUI.isAuto) {
            this.startSpin(this.rollingReelIDs);
        }
    }

    private async startSpin(reelIDs?: number[]): Promise<void> {
        let testData: number[] = this.createTestData(reelIDs);

        let resultData: number[][] = this.handleData(testData);

        console.log(resultData);

        let isTurboMode = this.simpleUI.isTurbo;

        this.slotMachine.startRoll(isTurboMode, reelIDs);

        await this.delay(this.serverDelayTime); // 模擬接收伺服器資料的延遲

        this.slotMachine.setReadyHand(this.readyHandReel);
        await this.slotMachine.stopRoll(resultData);

        if (this.simpleUI.isAuto) {
            await this.delay(0.5);
            this.startSpin(this.rollingReelIDs);
        }
        else {
            this.simpleUI.setNormalMode();
        }
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
        let remainSymbolList = reelID === this.slotMachine.reelAmount - 1 ? [...MAGNIFICATION_SYMBOLS_LIST] : [...NORMAL_SYMBOLS_LIST];
        let uniqueSymbolIDList = reelID === this.slotMachine.reelAmount - 1 ? [...MAGNIFICATION_SYMBOLS_LIST] : [0];
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

        for (let index = 0; index < this.slotMachine.reelAmount; index++) {
            let iconAmount: number = this.slotMachine.getIconAmount(index);
            resultData[index] = data.slice(index * iconAmount, (index + 1) * iconAmount);
        }

        return resultData;
    }

    private onStopBtnClick(): void {
        this.slotMachine.stopRollCallBack();
    }

    protected delay(time: number): Promise<void> {
        return new Promise<void>((resolve) => {
            this.scheduleOnce(() => {
                resolve();
            }, time);
        });
    }
}


