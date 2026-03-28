import { _decorator, CCInteger } from 'cc';
import { DropSlotMachineController } from '../../../Scripts/DropReel/DropSlotMachineController';
import { GameDropResultData, RoundRemoveData } from '../../../Scripts/DropReel/DropReelDataStructure';
import { GameController } from 'db://assets/Scripts/GameScripts/Controller';
import { GameMode } from 'db://assets/Scripts/GameScripts/Definition';
import { GenericUIManager } from 'db://assets/Scripts/GameScripts/GenericUI/Scripts';
const { ccclass, property } = _decorator;

@ccclass('DropReelGameMainTest')
export class DropReelGameMainTest extends GameController {
    @property(DropSlotMachineController)
    protected slotMachine: DropSlotMachineController = null;

    @property({ type: CCInteger, min: -1, tooltip: '用來測試server延遲效果' })
    protected serverDelay: number = 0;

    public override init(gameMode: GameMode, isOnline: boolean): void {
        super.init(gameMode, isOnline);

        this.slotMachine.init();
        this.slotMachine.allReelRollEndCallBack = this.autoSpin.bind(this);
        GenericUIManager.instance.onStopBtnClickCallback = this.slotMachine.stopRollCallBack.bind(this.slotMachine);
    }

    public onStartSpin(): void {
        GenericUIManager.instance.resetMainUIStopBtn();
        this.startSpin();
    }

    public onStartAuto(autoTimes: number): void {
        this.autoSpin();
    }

    protected autoSpin(): void {
        if (GenericUIManager.instance.checkAutoStatus()) {
            this.startSpin();
        }
        else {
            GenericUIManager.instance.setMainUIToNormalMode();
        }
    }

    protected startSpin(): void {
        GenericUIManager.instance.setMainUIToSpinMode();
        let isTurbo = GenericUIManager.instance.isTurboOn;
        this.slotMachine.startDrop(isTurbo);

        this.scheduleOnce(() => { // 模擬接收伺服器資料的延遲
            // this._slotMachine.setReadyHand(this._readyHandReel);  ==> readyHand 可自行設定
            let fakeResult = this.generateFakeData();
            this.slotMachine.stopDrop(fakeResult);
        }, this.serverDelay);
    }

    protected generateFakeData(): GameDropResultData {
        // fakeData
        let firstRoundData = [[1, 2, 3], [1, 2, 3], [1, 2, 3], [1, 2, 3]]
        let removeIndex = [[[1], [0, 2], [1, 2], []], [[2], [2], [2], []], [[0], [0], [0], []]];
        let newIconSymbol = [[[5], [5, 5], [5, 5], []], [[6], [6], [6], []], [[7], [7], [7], []]];
        let totalRemoveResult: RoundRemoveData[] = [];
        let totalResult: GameDropResultData;

        for (let i = 0; i < removeIndex.length; i++) {
            let newRoundRemoveData = new RoundRemoveData(removeIndex[i], newIconSymbol[i])
            totalRemoveResult.push(newRoundRemoveData);
        }
        totalResult = new GameDropResultData(firstRoundData, totalRemoveResult);
        return totalResult;
    }
}


