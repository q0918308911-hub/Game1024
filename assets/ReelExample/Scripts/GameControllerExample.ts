import { _decorator, CCFloat, } from 'cc';
import { SlotMachineExample } from './SlotMachineExample';
import { RunTimeData } from './DataSetting/RunTimeData';
import { ControllerSettingData } from './DataSetting/ControllerSettingData';
import { ProcessSettingData } from './DataSetting/ProcessSettingData';
import { FakeDataExample, FakeServerExample } from './FakeServerExample';
import { GameController, GameMode, GenericUIManager, ShowWin } from '../../Scripts/ModuleEntry';

const { ccclass, property } = _decorator;

@ccclass('GameControllerExample')
export class GameControllerExample extends GameController {
    @property({ type: SlotMachineExample })
    private slotMachine: SlotMachineExample = null;

    @property(ShowWin)
    private specialWin: ShowWin = null;

    @property(CCFloat)
    private serverDelayTime: number = 1;

    private roundData: FakeDataExample = null;

    private controllerSetting: ControllerSettingData = null;
    private processSetting: ProcessSettingData = null;

    private fakeServer: FakeServerExample = new FakeServerExample();

    init(gameMode: GameMode, isOnline: boolean): void {
        super.init(gameMode, isOnline);

        this.fakeServer.init();

        this.controllerSetting = RunTimeData.instance.controllerData;
        this.processSetting = RunTimeData.instance.processData;

        this.slotMachine.init();
        GenericUIManager.instance.onStopBtnClickCallback = this.onStopBtnClick.bind(this);

        GenericUIManager.instance.setTwoLevelTurboMode(true);
    }

    public onStartSpin(): void {
        super.onStartSpin();
        GenericUIManager.instance.resetMainUIStopBtn();
        GenericUIManager.instance.showBottomTextIdle();
        this.startSpinPerformance(this.controllerSetting.rollingReelIDs);
    }

    public onStartAuto(autoTimes: number): void {
        super.onStartAuto(autoTimes);
        this.autoSpin();
    }

    private async autoSpin(): Promise<void> {
        if (GenericUIManager.instance.checkAutoStatus()) {
            GenericUIManager.instance.showBottomTextEmpty();
            this.startSpinPerformance(this.controllerSetting.rollingReelIDs);
        }
        else {
            GenericUIManager.instance.setMainUIToNormalMode();
            await this.delay(this.processSetting.runScoreToStandbyTime); //得分接待機動畫
            this.slotMachine.playStandByAnim(this.roundData.standbyIconPos, this.roundData.symbolScores);
        }
    }

    private async startSpinPerformance(reelIDs: number[]): Promise<void> {
        GenericUIManager.instance.setMainUIToSpinMode();

        this.roundData = this.fakeServer.createFakeData(reelIDs, this.betValue);
        let isTurboMode = GenericUIManager.instance.isTurboOn;

        this.slotMachine.startRoll(isTurboMode, reelIDs);

        await this.delay(this.serverDelayTime); // 模擬接收伺服器資料的延遲

        this.slotMachine.setReadyHandList(this.controllerSetting.readyHandReelList);
        await this.slotMachine.stopRoll(this.roundData.resultData);

        GenericUIManager.instance.forceClickMainUIStopBtn();

        if (this.roundData.winIconPos.length > 0) {
            await this.winPerformance(this.roundData);
        }

        if (GenericUIManager.instance.isAutoMode) {
            let awaitTime: number = GenericUIManager.instance.isTurboOn ?
                this.processSetting.turboRoundSpaceTime : this.processSetting.normalRoundSpaceTime;

            await this.delay(awaitTime); //自動模式局間間隔
        }

        this.autoSpin();
    }

    private async winPerformance(fakeData: FakeDataExample): Promise<void> {
        let awaitTime: number = GenericUIManager.instance.isTurboOn ?
            this.processSetting.turboStopToPlayWinTime : this.processSetting.normalStopToPlayWinTime;

        await this.delay(awaitTime); //滾輪停止接中獎動畫

        if (this.processSetting.winAnimAndRunScore && !this.controllerSetting.forceBigWin) {
            this.slotMachine.playIconWin(fakeData.winIconPos);
        }
        else {
            await this.slotMachine.playIconWin(fakeData.winIconPos);
            await this.delay(this.processSetting.winAnimToScoreTime); //中獎動畫接得分
        }

        let score = (this.betValue * fakeData.totalOdd).fixed();

        if (this.controllerSetting.forceBigWin) {
            await this.specialWin.showSpecialWin(fakeData.totalOdd + 25, this.betValue);
            score = (this.betValue * (fakeData.totalOdd + 25)).fixed();
            GenericUIManager.instance.showBottomTextWinScore(score);
        }
        else {
            if (this.processSetting.runScoreAndBottomScore) {
                GenericUIManager.instance.showBottomTextWinScore(score);
                await this.slotMachine.showScore(score);
            }
            else {
                await this.slotMachine.showScore(score);
                GenericUIManager.instance.showBottomTextWinScore(score);
            }
        }
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